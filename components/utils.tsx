type MaybeOmit<T, K extends string | number | symbol, B extends boolean> = B extends false ? Omit<T, K> : T;

export type PropsForTag<T extends keyof JSX.IntrinsicElements, Children extends boolean = true> = MaybeOmit<
  Omit<JSX.IntrinsicElements[T], 'key' | 'ref'>,
  'children',
  Children
>;
