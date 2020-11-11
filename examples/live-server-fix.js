/*
 * This fixes content security policy's blocking of the injected
 * live-server reload script by adding the nonce attribute.
 */

document.addEventListener('DOMContentLoaded', function () {

  // Find first script with a non-empty nonce attribute
  var first = document.querySelector('script[nonce]:not([nonce=""])');
  var nonce = first.getAttribute('nonce');

  [].slice.call(document.querySelectorAll('script')).forEach(script => {

    /*
     * Assume a match if the script body contains the Live reload console
     * statement but the nonce attribute does not match the initial script nonce
     * value.
     */

    if (script.textContent.match(/Live reload enabled./i)
      && script.getAttribute('nonce') !== nonce) {

      /*
       * live-server expects links, styles, and scripts in the head element. The
       * newStatement allows us to replace them no matter where they reside in
       * the document.
       */

      var statement = 'head.removeChild(elem)';
      var newStatement = ';head = elem.parentNode; ' + statement;
      var scriptText = script.textContent;
      var newScript = document.createElement('script');

      newScript.textContent = scriptText.replace(statement, newStatement);
      newScript.setAttribute('nonce', nonce);

      script.parentNode.replaceChild(newScript, script);

      console.log('live-server reload listener script reloaded. <Guy Fieri/>');
    }
  });
});
