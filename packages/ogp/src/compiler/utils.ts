import * as babel from '@babel/core';
import { babel as babelUtils } from '@solid-mediakit/shared';

type Types = typeof babel.types;

export interface DynamicImage {
  element: babel.types.JSXElement;
  reactives: number;
  imageOptions?: babel.types.ObjectExpression;
}

function extractChild(t: Types, element: babel.types.JSXElement): babel.types.JSXElement | null {
  const elementChildren: babel.types.JSXElement[] = [];
  for (const child of element.children) {
    if (t.isJSXElement(child)) {
      elementChildren.push(child);
    }
  }
  if (elementChildren.length === 0) {
    return null;
  }
  if (elementChildren.length === 1) {
    return elementChildren[0];
  }
  // Satori needs one root, so wrap several children in a div.
  return t.jsxElement(
    t.jsxOpeningElement(t.jsxIdentifier('div'), []),
    t.jsxClosingElement(t.jsxIdentifier('div')),
    elementChildren,
    false,
  );
}

function extractImageOptions(
  element: babel.types.JSXElement,
): babel.types.ObjectExpression | undefined {
  const attributes = element.openingElement.attributes;
  for (let index = 0; index < attributes.length; index++) {
    const attr = attributes[index];
    if (attr.type !== 'JSXAttribute' || attr.name.name !== 'imageOptions') {
      continue;
    }
    // Only an inline object literal can move to the server function.
    if (
      attr.value?.type !== 'JSXExpressionContainer' ||
      attr.value.expression.type !== 'ObjectExpression'
    ) {
      return undefined;
    }
    attributes.splice(index, 1);
    return attr.value.expression;
  }
  return undefined;
}

/**
 * Replaces each expression that may change between renders with `r<n>`, and
 * returns the replaced expressions in order. They become the server function's
 * arguments.
 */
export function extractAndReplaceReactives(
  t: Types,
  elementPath: babel.NodePath<babel.types.JSXElement>,
): babel.types.Expression[] {
  const reactives: babel.types.Expression[] = [];

  function replaceExpression(
    path: babel.NodePath<
      babel.types.CallExpression | babel.types.MemberExpression | babel.types.Identifier
    >,
  ): void {
    const expr = path.node;
    path.replaceWith(t.identifier(`r${reactives.length}`));
    reactives.push(t.cloneNode(expr));
    path.skip();
  }

  elementPath.traverse({
    Property(path) {
      if (path.node.type === 'ClassPrivateProperty') {
        return;
      }
      // A computed key is an expression. A plain key is a static name.
      const key = path.node.key;
      if (path.node.computed && key.type !== 'PrivateName') {
        path.node.key = t.identifier(`r${reactives.length}`);
        reactives.push(t.cloneNode(key));
      }
      path.skip();
    },
    // Any call could return a different value.
    CallExpression: replaceExpression,
    // Replace the whole access rather than descending into it, otherwise the
    // property names of `a.b.c` are each extracted as their own reactive.
    MemberExpression: replaceExpression,
    Identifier: replaceExpression,
  });
  return reactives;
}

export function replaceDynamicImages(
  t: Types,
  programPath: babel.NodePath<babel.types.Program>,
): DynamicImage[] {
  const images: DynamicImage[] = [];
  programPath.traverse({
    JSXElement(elementPath) {
      const name = elementPath.node.openingElement.name;
      if (!t.isJSXIdentifier(name) || name.name !== 'DynamicImage') {
        return;
      }
      const imageOptions = extractImageOptions(elementPath.node);
      const reactives = extractAndReplaceReactives(t, elementPath);
      const child = extractChild(t, elementPath.node);
      if (!child) {
        throw new Error('DynamicImage must have a child element');
      }
      images.push({
        reactives: reactives.length,
        element: t.cloneNode(child),
        imageOptions,
      });

      // Call the generated component with the reactive values.
      const call = t.callExpression(t.identifier(`DynamicImage${images.length}`), [
        t.objectExpression([
          t.objectProperty(t.identifier('values'), t.arrayExpression(reactives)),
        ]),
      ]);
      const parent = elementPath.parentPath;
      elementPath.replaceWith(
        parent.isJSXElement() || parent.isJSXFragment()
          ? t.jsxExpressionContainer(call)
          : t.expressionStatement(call),
      );
    },
  });
  return images;
}

/** Creates `const [r0, r1, ...] = args`, or null when there are no arguments. */
export function createArgumentDeclaration(
  t: Types,
  image: DynamicImage,
): babel.types.VariableDeclaration | null {
  if (image.reactives === 0) {
    return null;
  }
  const args: babel.types.Identifier[] = [];
  for (let i = 0; i < image.reactives; i++) {
    args.push(t.identifier(`r${i}`));
  }
  return t.variableDeclaration('const', [
    t.variableDeclarator(t.arrayPattern(args), t.identifier('args')),
  ]);
}

function pushDynamicImages(
  images: DynamicImage[],
  t: Types,
  programPath: babel.NodePath<babel.types.Program>,
  template: (
    replacements: Record<string, unknown>,
  ) => babel.types.Statement | babel.types.Statement[],
): void {
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    babelUtils.pushStmts(
      template({
        compName: `DynamicImage${i + 1}`,
        serverFnName: `DynamicImage${i + 1}ServerFunction`,
        jsx: image.element,
        args: createArgumentDeclaration(t, image),
        imageOptions: image.imageOptions,
      }),
      programPath,
      true,
    );
  }
}

/** Adds the server functions and url components for SolidStart. */
export function addDynamicImages(
  images: DynamicImage[],
  t: Types,
  programPath: babel.NodePath<babel.types.Program>,
): void {
  const template = babel.template(
    `const %%serverFnName%% = GET((...args)=>{
        'use server';
        %%args%%
        return createOpenGraphImage(%%jsx%%, %%imageOptions%%);
    });
    const %%compName%% = (props)=>{
      const url = createMemo(()=>serverFunctionUrl(%%serverFnName%%, ...props.values));
      return url;
    };`,
    { plugins: ['jsx'] },
  );
  pushDynamicImages(images, t, programPath, template);
}

/** Adds the server functions and url components for TanStack Start. */
export function addDynamicImagesTanstack(
  images: DynamicImage[],
  t: Types,
  programPath: babel.NodePath<babel.types.Program>,
): void {
  const template = babel.template(
    `const %%serverFnName%% = createServerFn({
      method: "GET",
      response: "raw",
    }).handler((ctx) => {
      const args = ctx.data.values;
      %%args%%
      return createOpenGraphImage(%%jsx%%, %%imageOptions%%);
    })
    const %%compName%% = (props) => {
      const payload = () => ({"data":{"values":props.values},"context":{}})
      const url = createMemo(() => \`\${%%serverFnName%%.url}?payload=\${encodeURIComponent(JSON.stringify(payload()))}&createServerFn&raw\`)
      return url
    }
    `,
  );
  pushDynamicImages(images, t, programPath, template);
}
