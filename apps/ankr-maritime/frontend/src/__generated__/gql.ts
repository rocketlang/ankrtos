/* eslint-disable */
import { gql as apolloGql } from '@apollo/client';

export function gql(source: string): any {
  return apolloGql(source);
}
