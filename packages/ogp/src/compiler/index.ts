import MagicString from 'magic-string';
import type { SourceMap } from 'magic-string';
import { parseSync } from 'oxc-parser';
import { eachChild } from './ast';
import type { Node } from './ast';

/**
 * Which server function runtime the compiled output targets. `Solid` is Solid
 * 2.0's own, compiled by @solidjs/vite-plugin with `serverFunctions` on.
 */
export type Runtime = 'Solid' | 'TanstackStart';

export interface CompileOptions {
  runtime?: Runtime;
}

export interface CompileOutput {
  code: string;
  map: SourceMap;
}

interface DynamicImage {
  /** The JSX the server function renders, with each reactive replaced by `r<n>`. */
  jsx: string;
  /** Source text of the expressions passed to the server function. */
  values: string[];
  /** Source text of an inline `imageOptions` object. */
  imageOptions?: string;
}

const TS_FILE = /\.[mc]?tsx?$/i;

/** JSX stays on for plain `.ts` too, so components written in `.ts` files compile. */
function getLanguage(filename: string): 'jsx' | 'tsx' {
  return TS_FILE.test(filename) ? 'tsx' : 'jsx';
}

function isDynamicImage(node: Node): boolean {
  return (
    node.type === 'JSXElement' &&
    node.openingElement.name.type === 'JSXIdentifier' &&
    node.openingElement.name.name === 'DynamicImage'
  );
}

/** Reads an inline object literal passed as `imageOptions`. */
function readImageOptions(code: string, element: Node): string | undefined {
  for (const attr of element.openingElement.attributes as Node[]) {
    if (attr.type !== 'JSXAttribute' || attr.name.name !== 'imageOptions') {
      continue;
    }
    // Only an inline object literal can move to the server function.
    const value = attr.value as Node | null;
    if (value?.type === 'JSXExpressionContainer' && value.expression.type === 'ObjectExpression') {
      const expression = value.expression as Node;
      return code.slice(expression.start, expression.end);
    }
    return undefined;
  }
  return undefined;
}

/**
 * Replaces each expression in the subtree that may change between renders with
 * `r<n>`, and appends its source text to `values`. They become the server
 * function's arguments.
 */
function replaceReactives(s: MagicString, code: string, root: Node, values: string[]): void {
  function replace(node: Node, prefix = ''): void {
    s.overwrite(node.start, node.end, `${prefix}r${values.length}`);
    values.push(code.slice(node.start, node.end));
  }

  function visit(node: Node): void {
    switch (node.type) {
      // Any call or read could return a different value. Replace the whole
      // expression rather than descending into it, otherwise the property
      // names of `a.b.c` are each extracted as their own reactive.
      case 'Identifier':
      case 'CallExpression':
      case 'MemberExpression':
      case 'ChainExpression':
        replace(node);
        return;
      case 'Property':
        if (node.shorthand) {
          // `{ a }` keeps its key: it becomes `{ a: r0 }`.
          replace(node.value as Node, `${(node.key as Node).name as string}: `);
          return;
        }
        // A plain key is a static name. A computed key is an expression.
        if (node.computed) {
          visit(node.key as Node);
        }
        visit(node.value as Node);
        return;
      default:
        eachChild(node, visit);
    }
  }

  visit(root);
}

function extractDynamicImage(s: MagicString, code: string, element: Node): DynamicImage {
  const children: Node[] = [];
  for (const child of element.children as Node[]) {
    if (child.type === 'JSXElement') {
      children.push(child);
    }
  }
  if (children.length === 0) {
    throw new Error('DynamicImage must have a child element');
  }
  const values: string[] = [];
  const parts: string[] = [];
  for (const child of children) {
    replaceReactives(s, code, child, values);
    parts.push(s.slice(child.start, child.end));
  }
  return {
    // Satori needs one root, so wrap several children in a div.
    jsx: parts.length === 1 ? parts[0] : `<div>${parts.join('')}</div>`,
    values,
    imageOptions: readImageOptions(code, element),
  };
}

function createArgumentDeclaration(image: DynamicImage): string {
  if (image.values.length === 0) {
    return '';
  }
  const names: string[] = [];
  for (let i = 0; i < image.values.length; i++) {
    names.push(`r${i}`);
  }
  return `const [${names.join(', ')}] = args;\n  `;
}

function createRenderCall(image: DynamicImage): string {
  const options = image.imageOptions ? `, ${image.imageOptions}` : '';
  return `return createOpenGraphImage(${image.jsx}${options});`;
}

function createSolidImage(image: DynamicImage, id: number): string {
  const serverFn = `DynamicImage${id}ServerFunction`;
  return `const ${serverFn} = GET((...args) => {
  'use server';
  ${createArgumentDeclaration(image)}${createRenderCall(image)}
});
const DynamicImage${id} = (props) => {
  const url = createMemo(() => serverFunctionUrl(${serverFn}, ...props.values));
  return url;
};
`;
}

function createTanstackImage(image: DynamicImage, id: number): string {
  const serverFn = `DynamicImage${id}ServerFunction`;
  return `const ${serverFn} = createServerFn({
  method: "GET",
  response: "raw",
}).handler((ctx) => {
  const args = ctx.data.values;
  ${createArgumentDeclaration(image)}${createRenderCall(image)}
});
const DynamicImage${id} = (props) => {
  const payload = () => ({ data: { values: props.values }, context: {} });
  const url = createMemo(() => \`\${${serverFn}.url}?payload=\${encodeURIComponent(JSON.stringify(payload()))}&createServerFn&raw\`);
  return url;
};
`;
}

/**
 * Collects, by source, the names each module imports under their own name.
 * An aliased import (`import { a as b }`) does not bind `a`, so it is left out.
 */
function readImports(program: Node): Map<string, Set<string>> {
  const imports = new Map<string, Set<string>>();
  for (const statement of program.body as Node[]) {
    if (statement.type !== 'ImportDeclaration') {
      continue;
    }
    const source = statement.source.value as string;
    const names = imports.get(source) ?? new Set<string>();
    for (const specifier of statement.specifiers as Node[]) {
      if (
        specifier.type === 'ImportSpecifier' &&
        specifier.imported.name === specifier.local.name
      ) {
        names.add(specifier.local.name as string);
      }
    }
    imports.set(source, names);
  }
  return imports;
}

/**
 * Compiles each `<DynamicImage>` into a server function that renders the image
 * and a component that returns the image url. Returns null when the module has
 * no `<DynamicImage>`.
 */
export function compile(
  id: string,
  code: string,
  options: CompileOptions = {},
): CompileOutput | null {
  if (!code.includes('DynamicImage')) {
    return null;
  }
  const filename = id.split('?')[0];
  const result = parseSync(filename, code, {
    lang: getLanguage(filename),
    sourceType: 'module',
    preserveParens: false,
  });
  if (result.errors.length > 0) {
    throw new SyntaxError(result.errors[0].message);
  }
  const program = result.program as unknown as Node;
  const s = new MagicString(code);
  const images: DynamicImage[] = [];

  function visit(node: Node, parent: Node | null): void {
    if (!isDynamicImage(node)) {
      eachChild(node, (child) => {
        visit(child, node);
      });
      return;
    }
    const image = extractDynamicImage(s, code, node);
    images.push(image);
    // Call the generated component with the reactive values.
    const call = `DynamicImage${images.length}({ values: [${image.values.join(', ')}] })`;
    const inJsx = parent?.type === 'JSXElement' || parent?.type === 'JSXFragment';
    s.overwrite(node.start, node.end, inJsx ? `{${call}}` : call);
  }
  visit(program, null);

  if (images.length === 0) {
    return null;
  }

  // Add the generated code after the imports.
  const runtime = options.runtime ?? 'Solid';
  let generated = '';
  for (let i = 0; i < images.length; i++) {
    generated +=
      runtime === 'TanstackStart'
        ? createTanstackImage(images[i], i + 1)
        : createSolidImage(images[i], i + 1);
  }
  let lastImportEnd = 0;
  for (const statement of program.body as Node[]) {
    if (statement.type === 'ImportDeclaration') {
      lastImportEnd = statement.end;
    }
  }
  if (lastImportEnd > 0) {
    s.appendLeft(lastImportEnd, `\n${generated}`);
  } else {
    s.prepend(generated);
  }

  // Import what the generated code uses, unless the module already does.
  const needed: [string, string][] = [
    ['createMemo', 'solid-js'],
    ['createOpenGraphImage', '@solidjs/ogp/server'],
  ];
  if (runtime === 'Solid') {
    needed.push(['GET', '@solidjs/web/server-functions']);
    needed.push(['serverFunctionUrl', '@solidjs/web/server-functions']);
  }
  const imports = readImports(program);
  const missing = new Map<string, string[]>();
  for (const [name, source] of needed) {
    if (!imports.get(source)?.has(name)) {
      const names = missing.get(source) ?? [];
      names.push(name);
      missing.set(source, names);
    }
  }
  let header = '';
  for (const [source, names] of missing) {
    header += `import { ${names.join(', ')} } from '${source}';\n`;
  }
  s.prepend(header);

  return {
    code: s.toString(),
    map: s.generateMap({ source: filename, includeContent: true, hires: true }),
  };
}
