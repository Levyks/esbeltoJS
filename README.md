# esbeltoJS [ALPHA]

An simple view engine for Express with a Svelte-like syntax

## How to use
```
npm install esbelto
```
```js
const express = require('express');
const esbelto = require('esbelto');

const app = express();

//You can use 'svelte', 'esb', or any other extension, just make sure to configure your editor to treat it as a .svelte file
app.engine('svelte', esbelto);
app.set('view engine', 'svelte');
```

### Passing values

```js
app.get('/', function (req, res) {
  res.render('index', { user: { name: "John" } });
});
```
index.svelte:
```svelte
<script>
  let { user } = getVariables();
</script>

<head>
  <title>Esbelto</title>
</head>

<body>
  <h1>Welcome {user.name}!</h1>
</body>
```
![Welcome John](https://i.imgur.com/vVogPzE.png)

### {#if}, {#each} and include()
```js
app.get('/user', function (req, res) {
  res.render('user-dashboard', { 
    user: {
      name: "John Doe",
      age: 42,
      gender: 'M',
      isAdmin: true,
      children: [
        {
          name: "John Doe Jr",
          gender: 'M',
          age: 11
        },
        {
          name: "Jane Doe",
          gender: 'F',
          age: 19
        }
      ]
    }
  });
});
```
user-dashboard.svelte: 
```svelte
<script>
  let include = getInclude();
  let { user } = getVariables();
</script>

<head>
  {include('./partials/head.svelte', {title: "User Dashboard"})}
</head>

<body>
  <h1>{user.name}</h1>
  <h3>Age: {user.age}</h3>

  <h4>Children:</h4>
  
  <ul>
  {#each user.children as child}
    <li class="{child.gender == 'M' ? 'blue' : 'pink'}">{child.name} - {child.age}</li>
  {/each}
  </ul>

  {#if user.isAdmin}
    <button>Go to admin panel</button>
  {/if}

</body>
```
{#each array as elem, idx} syntax coming soon

partials/head.svelte:
```svelte
<script>
  let { title } = getVariables();
</script>

<title>{title}</title>
<link rel="stylesheet" href="/css/style.css">
```

![User Dashboard](https://i.imgur.com/Q051fQt.png)

