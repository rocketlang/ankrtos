// Quick test to check if port congestion schema loads
import { schema } from './src/schema/index.js';

const queryType = schema.getQueryType();
const fields = queryType.getFields();

console.log('\n=== Port Congestion Queries ===');
Object.keys(fields)
  .filter(name => name.toLowerCase().includes('congestion'))
  .forEach(name => {
    console.log(`✓ ${name}`);
  });

const mutationType = schema.getMutationType();
if (mutationType) {
  const mutations = mutationType.getFields();
  console.log('\n=== Port Congestion Mutations ===');
  Object.keys(mutations)
    .filter(name => name.toLowerCase().includes('congestion'))
    .forEach(name => {
      console.log(`✓ ${name}`);
    });
}

console.log('\nTotal queries:', Object.keys(fields).length);
console.log('Total mutations:', mutationType ? Object.keys(mutationType.getFields()).length : 0);
