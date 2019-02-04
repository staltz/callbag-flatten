import { Source } from 'callbag';

declare function flatten<T>(source: Source<Source<T>>): Source<T>;
