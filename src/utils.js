import redent from 'redent'
import {
  RECEIVED_COLOR as receivedColor,
  EXPECTED_COLOR as expectedColor,
  matcherHint,
  printWithType,
  printReceived,
  stringify,
} from 'jest-matcher-utils'
import {parse} from 'css'
import isEqual from 'lodash/isEqual'

class HtmlElementTypeError extends Error {
  constructor(received, matcherFn, context) {
    super()

    /* istanbul ignore next */
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, matcherFn)
    }
    let withType = ''
    try {
      withType = printWithType('Received', received, printReceived)
    } catch (e) {
      // Can throw for Document:
      // https://github.com/jsdom/jsdom/issues/2304
    }
    this.message = [
      matcherHint(
        `${context.isNot ? '.not' : ''}.${matcherFn.name}`,
        'received',
        '',
      ),
      '',
      `${receivedColor(
        'received',
      )} value must be an HTMLElement or an SVGElement.`,
      withType,
    ].join('\n')
  }
}

function checkHasWindow(htmlElement, ...args) {
  if (
    !htmlElement ||
    !htmlElement.ownerDocument ||
    !htmlElement.ownerDocument.defaultView
  ) {
    throw new HtmlElementTypeError(htmlElement, ...args)
  }
}

function checkHtmlElement(htmlElement, ...args) {
  checkHasWindow(htmlElement, ...args)
  const window = htmlElement.ownerDocument.defaultView

  if (
    !(htmlElement instanceof window.HTMLElement) &&
    !(htmlElement instanceof window.SVGElement)
  ) {
    throw new HtmlElementTypeError(htmlElement, ...args)
  }
}

class InvalidCSSError extends Error {
  constructor(received, matcherFn) {
    super()

    /* istanbul ignore next */
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, matcherFn)
    }
    this.message = [
      received.message,
      '',
      receivedColor(`Failing css:`),
      receivedColor(`${received.css}`),
    ].join('\n')
  }
}

function parseCSS(css, ...args) {
  const ast = parse(`selector { ${css} }`, {silent: true}).stylesheet

  if (ast.parsingErrors && ast.parsingErrors.length > 0) {
    const {reason, line} = ast.parsingErrors[0]

    throw new InvalidCSSError(
      {
        css,
        message: `Syntax error parsing expected css: ${reason} on line: ${line}`,
      },
      ...args,
    )
  }

  const parsedRules = ast.rules[0].declarations
    .filter(d => d.type === 'declaration')
    .reduce(
      (obj, {property, value}) => Object.assign(obj, {[property]: value}),
      {},
    )
  return parsedRules
}

function display(value) {
  return typeof value === 'string' ? value : stringify(value)
}

function getMessage(
  matcher,
  expectedLabel,
  expectedValue,
  receivedLabel,
  receivedValue,
) {
  return [
    `${matcher}\n`,
    `${expectedLabel}:\n${expectedColor(redent(display(expectedValue), 2))}`,
    `${receivedLabel}:\n${receivedColor(redent(display(receivedValue), 2))}`,
  ].join('\n')
}

function matches(textToMatch, matcher) {
  if (matcher instanceof RegExp) {
    return matcher.test(textToMatch)
  } else {
    return textToMatch.includes(String(matcher))
  }
}

function deprecate(name, replacementText) {
  // Notify user that they are using deprecated functionality.
  // eslint-disable-next-line no-console
  console.warn(
    `Warning: ${name} has been deprecated and will be removed in future updates.`,
    replacementText,
  )
}

function normalize(text) {
  return text.replace(/\s+/g, ' ').trim()
}

function getTag(element) {
  return element.tagName && element.tagName.toLowerCase()
}

function getSelectValue({multiple, options}) {
  const selectedOptions = [...options].filter(option => option.selected)

  if (multiple) {
    return [...selectedOptions].map(opt => opt.value)
  }
  /* istanbul ignore if */
  if (selectedOptions.length === 0) {
    return undefined // Couldn't make this happen, but just in case
  }
  return selectedOptions[0].value
}

function getInputValue(inputElement) {
  switch (inputElement.type) {
    case 'number':
      return inputElement.value === '' ? null : Number(inputElement.value)
    case 'checkbox':
      return inputElement.checked
    default:
      return inputElement.value
  }
}

function getSingleElementValue(element) {
  /* istanbul ignore if */
  if (!element) {
    return undefined
  }
  switch (element.tagName.toLowerCase()) {
    case 'input':
      return getInputValue(element)
    case 'select':
      return getSelectValue(element)
    default:
      return element.value
  }
}

function compareArraysAsSet(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return isEqual(new Set(a), new Set(b))
  }
  return undefined
}

function parseJStoCSS(document, css) {
  const sandboxElement = document.createElement('div')
  Object.assign(sandboxElement.style, css)
  return sandboxElement.style.cssText
}

function propIsShorthand(propToParse) {
  const shorthandProperties = [
    "animation",
    // -duration | -timing-function | -delay | -iteration-count | -direction |
    // -fill-mode | -play-state | -name

    "background",
    // -image | -position | -size | -repeat | -origin | -clip | -attachment | -color

    //
    // Note: 'border(-*)' property names don't always concatenate longhand property specifications
    //

    "border",
    // -width | -style | -color

    "border-bottom",
    // -width | -style | -color

    "border-color",
    // border-top-color | border-right-color | border-bottom-color | border-left-color

    "border-left",
    // -width | -style | -color

    "border-radius",
    // border-top-left-radius | border-top-right-radius | border-bottom-right-radius |
    // border-bottom-left-radius

    "border-right",
    // -width | -style | -color

    "border-style",
    // border-top-style | border-right-style | border-bottom-style | bottom-left-style

    "border-top",
    // -width | -style | -color

    "border-width",
    // border-top-width | border-right-width | border-bottom-width | border-left-width
    // border-block-start-width | border-block-end-width | border-inline-start-width |
    // border-inline-end-width

    "column-rule",
    // -width | -style | -color

    "columns",
    // -width | -count

    "flex",
    // -grow | -shrink | -basis

    "flex-flow",
    // -directon | -wrap

    "font",
    // -style | -variant | -weight | -stretch | -size | -height | -family

    "grid",
    // -template-rows | -template-columns | -template-areas | -auto-rows |
    // -auto-columns | -auto-flow | -column-gap | row-gap | gap

    //
    // Note: 'grid-area' has a different pattern for longhand properties
    //

    "grid-area",
    // grid-row-start | grid-column-start | grid-row-end | grid-column-end

    "grid-column",
    // -start | -end

    "grid-row",
    // -start | -end

    "grid-template",
    // -columns | -rows | -areas

    "list-style",
    // -type | -position | -image

    "margin",
    // -top | -right | -bottom | -left

    "offset",
    // -position | -path | -distance | -rotate | -anchor

    "outline",
    // -style | -width | -color

    "overflow",
    // -x | -y

    "padding",
    // -top | -right | -bottom | -left

    //
    // note: 'place-*' shorthand properties are entirely different from the longhand properties
    //

    "place-content",
    // align-content | justify-content

    "place-items",
    // align-items | justify-items

    "place-self",
    // align-self | justify-self

    "text-decoration",
    // -line | -color | -style | -thickness

    "transition",
    // -property | -duration | -timing-function | -delay
  ]

  return shorthandProperties.some((prop) => {
    const containsShorthand = new RegExp(`^${prop}$`)
    return containsShorthand.test(propToParse)
  })
}

export {
  HtmlElementTypeError,
  checkHtmlElement,
  parseCSS,
  deprecate,
  getMessage,
  matches,
  normalize,
  getTag,
  getSingleElementValue,
  compareArraysAsSet,
  parseJStoCSS,
  propIsShorthand,
}
