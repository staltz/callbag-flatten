import { Source } from 'callbag';

export default function flatten<T>(source: Source<Source<T>>): Source<T>;
