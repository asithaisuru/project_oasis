// Legacy seed commands now use an isolated, fictional database and never reset an existing database.
console.log('Starting the disposable fictional demo; inherited database settings are ignored.');
await import('./demo.js');
