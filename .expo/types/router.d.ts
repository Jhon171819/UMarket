/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(tabs)` | `/(tabs)/` | `/(tabs)/sales` | `/(tabs)/scanner` | `/(tabs)/settings` | `/(tabs)/stock` | `/_sitemap` | `/sales` | `/scanner` | `/settings` | `/stock`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
