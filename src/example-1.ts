/*
  Example 1: Promises
*/

const promise = new Promise(resolve => {
  setTimeout(() => {
    resolve('Hello from a Promise!');
  }, 5000);
});

promise.then(value => console.log(value));
