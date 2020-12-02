
/* Move the whole test to a single script to avoid script vs import CSP mess */

import "https://unpkg.com/mocha/mocha.js"
import "https://unpkg.com/chai/chai.js"
import { where } from '../../where.js';

mocha.setup('bdd')

describe("wheredoc with mocha+chai bdd example", () => {
  let { expect } = chai;

  describe("where", () => {
    describe("passing", () => {
      function spec(a, b, c) {
        expect(c).to.equal(a + b);

        where: `
            a | b | c
            1 | 2 | 3
            A | B | AB
          `;
      }

      where(spec).forEach(({ params, test }) => {
        var { a, b, c } = params;

        it(`with ${a} and ${b} expect ${c}.`, test)
      })
    })

    describe("failing", () => {
      function spec(a, b, c) {
        expect(c).to.equal(a + b);

        where: `
            a | b | c
            a | b | bonk
          `;
      }

      where(spec).forEach(({ params, test }) => {
        var { a, b, c } = params;

        it(`should fail.`, test)
      })
    })
  })

  describe("DOM fixtures", () => {
    var fixture = document.querySelector("[fixtures]");
    var list = fixture.querySelector("[fixture-list]")
    var parser = new DOMParser()

    describe("Checkbox test", () => {
      var dom = parser.parseFromString(`
        <li test-fixture="checkbox-test">
          <h3>Checkbox test</h3>
          <input type=checkbox id="test-checkbox">
          <label for=test-checkbox>Yes?</label>
        </li>
        `, "text/html");

      var fixture = dom.querySelector("[test-fixture]")
      var label = fixture.querySelector("[for=test-checkbox]");
      var checkbox = fixture.querySelector("[type=checkbox]")

      list.appendChild(fixture)

      function spec(action, checked) {
        label[action]()

        expect(checkbox.checked).to.equal(checked)

        where: `
          action  | checked
          click   |   true
          click   |   false
          click   |   true
          blur    |   true
          click   |   false
          click   |   true
        `;
      }

      where(spec).forEach(({ params, test }) => {
        var { action, checked } = params;

        it(`on *${action}*, checkbox should ${checked ? "" : "*not*"} be *checked*.`, test)
      })
    })

    describe("Validation test", () => {
      var dom = parser.parseFromString(`
        <li test-fixture="validation-test">
          <h3>Validation test</h3>
          <form validation-form>
            <label for="test-validation">Should start with 5 digits, followed by alphanumeric.</label>
            <input id="test-validation" validation-input required pattern="([0-9]{5,})+[A-z\d]*">
            <button validation-button>Valid?</button>
          </form>
        </li>
        `, "text/html");

      var fixture = dom.querySelector("[test-fixture]")
      var input = fixture.querySelector("[validation-input]")
      var button = fixture.querySelector("[validation-button]")

      list.appendChild(fixture)

      button.onclick = function (e) {
        // Don't submit the form, to prevent a page refresh.
        e.preventDefault()

        var match = input.matches(":valid");
        button.textContent = match ? "Valid" : "Invalid"
      }

      // This lets us test the fixture manually.
      input.oninput = function (e) {
        var match = input.matches(":valid");
        button.textContent = match ? "Valid" : "Invalid"
      }

      function spec(value, valid) {
        input.value = value
        button.click()
        expect(input.matches(":valid")).to.equal(valid)

        where: `
          |   value    |  valid  |

          |            |  false  |
          |      thing |  false  |
          |        123 |  false  |
          |      94102 |   true  |
          |  123456789 |   true  |
          | 12345-4589 |  false  |
          |   12345abc |   true  |
        `;
      }

      where(spec).forEach(({ params, test }) => {
        var { value, valid } = params;

        it(`on *${value}*, input should ${valid ? "" : "*not*"} be *valid*.`, test)
      })
    })
  })
})

mocha.checkLeaks();
mocha.run();

console.log('Tests complete. <Guy Fieri/>');
