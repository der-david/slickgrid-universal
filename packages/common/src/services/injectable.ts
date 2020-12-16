/* blog post: https://sentinelone-tech.medium.com/dependency-injection-in-typescript-from-scratch-d1a4422043a0 */
export type Ctr<T> = new (...args: any[]) => T;

type ClazzDecorator<T> = (target: T) => void;

export function Injectable<T>(): ClazzDecorator<Ctr<T>> {
  return (target: Ctr<any>) => {
    // this is needed so the design:paramtypes could be collected
    console.log('Injectable decorator', target.name, 'is used');
  };
}

/* eslint-disable no-redeclare */
// export type Target = {
//   new(...args: any[]): any,
//   optional: boolean
// };

// export function Injectable(target: Target): void;
// export function Injectable(optional: boolean): (target: Target) => void;
// export function Injectable(optionalOrTarget: boolean | Target) {
//   if (typeof optionalOrTarget !== 'boolean') {
//     console.log(optionalOrTarget, ' is now decorated');
//     return (target: Ctr<any>) => {
//       // this is needed so the design:paramtypes could be collected
//       console.log('inside: Injectable decorator');
//       console.log(target.name, ' is used');
//     };
//   } else {
//     return function (target: Target) {
//       const optional = optionalOrTarget || target.optional;
//       console.log(optional, ' is now decorated');
//     };
//   }
// }
