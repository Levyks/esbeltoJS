# esbeltoJS [BETA]

A simple view engine for Express with a Svelte-like syntax

## How to use
```
npm install esbelto
```
```js
const express = require('express');
const esbelto = require('esbelto');

const app = express();

/*You can use 'svelte', 'esb', or any other extension
 *just make sure to configure your editor to treat it as a .svelte file
 */
app.engine('svelte', esbelto.express);
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
<script id="esbelto">
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
<script id="esbelto">
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
You can also use 
```svelte
{#each array as elem, idx}
```
To get the index of the current iteration

partials/head.svelte:
```svelte
<script id="esbelto">
  let { title } = getVariables();
</script>

<title>{title}</title>
<link rel="stylesheet" href="/css/style.css">
```

![User Dashboard](https://i.imgur.com/Q051fQt.png)

### includeScript

Most editors for .svelte files will warn you if you have more than one <script> tag in your code.
This isn't a problem for Esbelto, but, if you want to avoid that warning, you can use the includeScript method

head.svelte
```svelte
<script id="esbelto">
  let includeScript = getIncludeScript();
  let { title, scripts } = getVariables();
</script>

<title>{title}</title>

{includeScript({
  src: "https://code.jquery.com/jquery-3.6.0.min.js",
  integrity: "sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4=",
  crossorigin: "anonymous"
})}

{#if scripts}
  {#each scripts as script}
    {includeScript(script)}
  {/each}
{/if}
```
included with:
```svelte
<script id="esbelto">
  let include = getInclude();
  let { title, description, locale, grids } = getVariables();
</script>
<head> 
  {include('./head.svelte', {title: "pé de goiaba", scripts: ['/js/user/login.js']})}
</head>
<!-- ... -->
```
You can use either an string with the script's src or an object with each desired property of the <script> tag