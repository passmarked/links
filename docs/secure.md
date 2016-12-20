Serving unsecured javascript or css allows an attacker to modify seemingly secure page content, effectively bypassing any encryption. Unsecured javascript (and css) can be modified (on the fly) by an attacker — especialy on unsecured public networks.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Seemingly Secured Page</title>
</head>
<body>
  <p>Page content</p>
  
  <!-- BAD, uses unsecure http even if https is available -->
  <script src="http://externaldomain.com/externalResource.js"></script>
</body>
</html>
```

# How do I fix this ?

Use protocol relative urls for internal and external resources, **but make sure the external resources are available on `https`**.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Secured Page</title>
</head>
<body>
  <p>Page content</p>
  
  <!-- GOOD, fetches with https if the current page was fetched securely -->
  <script src="//externaldomain.com/externalResource.js"></script>
</body>
</html>
```

# Resources

* [MDN - Mixed Content](https://developer.mozilla.org/en/docs/Security/MixedContent
* [Google Developers - What is mixed content?](https://developers.google.com/web/fundamentals/security/prevent-mixed-content/what-is-mixed-content?hl=en)
