export interface Node {
  type: string;
  start: number;
  end: number;
  // The compiler walks a structural AST; property access is untyped by design.
  [key: string]: any;
}

/** Keys that hold TypeScript type-space nodes; never traversed. */
const TYPE_KEYS = new Set([
  'typeAnnotation',
  'typeArguments',
  'typeParameters',
  'returnType',
  'superTypeArguments',
  'implements',
]);

function isNode(value: unknown): value is Node {
  return value != null && typeof value === 'object' && typeof (value as Node).type === 'string';
}

/** Invokes `cb` for every direct child node, skipping TypeScript type-space keys. */
export function eachChild(node: Node, cb: (child: Node) => void): void {
  for (const key of Object.keys(node)) {
    if (TYPE_KEYS.has(key)) {
      continue;
    }
    const value = node[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        if (isNode(item)) {
          cb(item);
        }
      }
    } else if (isNode(value)) {
      cb(value);
    }
  }
}
