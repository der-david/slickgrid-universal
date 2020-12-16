import 'reflect-metadata';
import { Ctr } from './injectable';

export class Injector {

  private depInstances: Map<string, Ctr<any>> = new Map<string, Ctr<any>>();

  inject<T>(target: Ctr<T>) {
    console.log('!!inject', target.name)
    this.depInstances.set(target.name, target);
  }

  // Not storing an instances map
  static resolve<T>(target: Ctr<T>): T {
    const tokens = Reflect.getMetadata('design:paramtypes', target) || [];
    const injections = tokens.map((token: any) => Injector.resolve<any>(token));
    console.log('TYPEOF ', typeof target)
    return new target(...injections);
  }

  // Storing Instances map so a service will only have one instance
  resolve<T>(target: Ctr<any>): any {
    if (this.depInstances && this.depInstances.has(target.name)) {
      console.log(target.name, 'instance exists');
      return this.depInstances.get(target.name);
    }

    const tokens = Reflect.getMetadata('design:paramtypes', target) || [];
    const injections = tokens.map((token: any) => Resolver.resolve<any>(token));
    this.depInstances.set(target.name, target);
    console.log('TYPEOF ', typeof target)
    console.log(this.depInstances);

    return new target(...injections);
  }
}

export const Resolver = new Injector();
