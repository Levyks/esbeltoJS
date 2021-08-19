# esbeltoJS

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
app.get('/', (req, res) => {
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
---

### {#if}, {:else} and {:else if}
```js
app.get('/if', (req, res) => {
  res.render('if', { 
    user: {
      isOwner: false,
      isAdmin: true
    }
  });
});
```
if.svelte: 
```svelte
{#if user.isOwner}
  <button>Owner dashboard</button>
{:else if user.isAdmin}
  <button>Admin dashboard</button>
{:else}
  <button>User dashboard</button>
{/if}
```
![If example](https://i.imgur.com/TImXMt4.png)
---

### {#each}
```js
app.get('/each', (req, res) => {
  res.render('each', {
    books: [
      "The Hitchhiker's Guide to the Galaxy",
      "The Restaurant at the End of the Universe",
      "Life, the Universe and Everything",
      "So Long, and Thanks for All the Fish",
      "Mostly Harmless"
    ]
  });
});
```
each.svelte:
```svelte
{#each books as book}
  <h2>{book}</h2>
{/each}
<br>
{#each books as book, idx}
  <h2>{idx+1}° -> {book}</h2>
{/each}
```
![Each example](https://i.imgur.com/R5K65Nq.png)
---

### Escaping {@html}
Just as in Svelte, Esbelto also escapes HTML by default, if you do not want to escape it, just add a `@html` after the `{`
```js
app.get('/escaping', function (req, res) {
  res.render('escaping', {
    title: '<b>This is the title</b>'
  });
});
```
escaping.svelte:
```svelte
<p>{title}</p>
<p>{@html title}</p>
```
![Escaping example](https://i.imgur.com/LXDch0V.png)
---
### include and includeScript

Most editors for .svelte files (like Svelte's extension for VSCode) will warn you if you have more than one `<script>` tag in your code.
This isn't a problem for Esbelto, but, if you want to avoid that warning, you can use the includeScript method(You can use either an string with the script's src or an object with each desired property of the `<script>` tag)

include.svelte:
```svelte
<script id="esbelto">
  let include = getInclude();
</script>

<head>
  {include('./head.svelte', {title: "Testing include", scripts: ['js/main.js']})}
</head>

<body>
  <span class='text-success ms-1'>Hello World!</span>
</body>  
```
head.svelte:
```svelte
<script id="esbelto">
  let includeScript = getIncludeScript();
  let { title, scripts } = getVariables();
</script>

<title>{title}</title>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.0/dist/css/bootstrap.min.css" integrity="sha384-KyZXEAg3QhqLMpG8r+8fhAXLRk2vvoC2f3B09zVXn8CA5QIVfZOJ3BCsw2P0p/We" crossorigin="anonymous">

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
![Include example](https://user-images.githubusercontent.com/16294244/130052111-6a13be9d-cfe3-4156-a8ca-a10c76336164.png)
---
### config
You can tweak some settings by using the `esbelto.config()` method, although it's not required
```js
const esbelto = require('./esbelto');
const express = require('express');

const app = express();

//Defaults
esbelto.config({
  htmlStartTag: '<!DOCTYPE html>\n<html>\n',
  htmlEndTag: '\n</html>',
  cacheCompiled: true
});

app.engine('svelte', esbelto.express);
app.set('view engine', 'svelte');
```
`cacheCompiled` makes every render after the 1st faster, but it can also be quite annoying during development, as nodemon won't restart by default after a change on a .svelte file, so you can just set it to `false` during development to avoid it

---
### Benchmark

this is not by any means official, just a quick test I made forking [baryshev's benchmark](https://github.com/baryshev/template-benchmark) and adding esbelto to it, full results available at [Levyks/template-benchmark](https://github.com/Levyks/template-benchmark)
```
Rendering 100000 templates:

esbeltoJS
 Escaped   : 1334ms
 Unescaped : 39ms
 Total     : 1373ms

EJS
 Escaped   : 3090ms
 Unescaped : 1443ms
 Total     : 4533ms

EJS without `with`
 Escaped   : 1288ms
 Unescaped : 50ms
 Total     : 1338ms

Pug
 Escaped   : 4063ms
 Unescaped : 47ms
 Total     : 4110ms

Pug without `with`
 Escaped   : 3594ms
 Unescaped : 27ms
 Total     : 3621ms
 ...
```

