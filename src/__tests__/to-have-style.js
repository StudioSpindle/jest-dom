import {render} from './helpers/test-utils'
import document from './helpers/document'

// eslint-disable-next-line max-lines-per-function
describe('.toHaveStyle', () => {
  test('handles positive test cases', () => {
    const {container} = render(`
          <div class="label" style="background-color: blue; height: 100%">
            Hello World
          </div>
        `)

    const style = document.createElement('style')
    style.innerHTML = `
          .label {
            align-items: center;
            background-color: black;
            color: white;
            float: left;
            transition: opacity 0.2s ease-out, top 0.3s cubic-bezier(1.175, 0.885, 0.32, 1.275);
            transform: translateX(0px);
          }
        `
    document.body.appendChild(style)
    document.body.appendChild(container)

    expect(container.querySelector('.label')).toHaveStyle(`
          height: 100%;
          color: white;
          background-color: blue;
        `)

    expect(container.querySelector('.label')).toHaveStyle(`
          background-color: blue;
          color: white;
        `)

    expect(container.querySelector('.label')).toHaveStyle(
      'transition: opacity 0.2s ease-out, top 0.3s cubic-bezier(1.175, 0.885, 0.32, 1.275)',
    )

    expect(container.querySelector('.label')).toHaveStyle(
      'background-color:blue;color:white',
    )

    expect(container.querySelector('.label')).not.toHaveStyle(`
          color: white;
          font-weight: bold;
        `)

    expect(container.querySelector('.label')).toHaveStyle(`
        Align-items: center;
      `)

    expect(container.querySelector('.label')).toHaveStyle(`
      transform: translateX(0px);
    `)
  })

  test('handles negative test cases', () => {
    const {container} = render(`
    <div class="label" style="background-color: blue; height: 100%">
      Hello World
    </div>
  `)

    const style = document.createElement('style')
    style.innerHTML = `
    .label {
      background-color: black;
      color: white;
      float: left;
      transition: opacity 0.2s ease-out, top 0.3s cubic-bezier(1.175, 0.885, 0.32, 1.275);
    }
  `
    document.body.appendChild(style)
    document.body.appendChild(container)

    expect(() =>
      expect(container.querySelector('.label')).toHaveStyle(
        'font-weight: bold',
      ),
    ).toThrowError()

    expect(() =>
      expect(container.querySelector('.label')).not.toHaveStyle('color: white'),
    ).toThrowError()

    expect(() =>
      expect(container.querySelector('.label')).toHaveStyle(
        'transition: all 0.7s ease, width 1.0s cubic-bezier(3, 4, 5, 6);',
      ),
    ).toThrowError()

    // Make sure the test fails if the css syntax is not valid
    expect(() =>
      expect(container.querySelector('.label')).not.toHaveStyle(
        'font-weight bold',
      ),
    ).toThrowError()

    expect(() =>
      expect(container.querySelector('.label')).toHaveStyle('color white'),
    ).toThrowError()

    document.body.removeChild(style)
    document.body.removeChild(container)
  })

  test('properly normalizes colors', () => {
    const {queryByTestId} = render(`
      <span data-testid="color-example" style="background-color: #123456">Hello World</span>
    `)
    expect(queryByTestId('color-example')).toHaveStyle(
      'background-color: #123456',
    )
  })

  test('properly normalizes colors for border', () => {
    const {queryByTestId} = render(`
    <span data-testid="color-example" style="border: 1px solid #fff">Hello World</span>
  `)
    expect(queryByTestId('color-example')).toHaveStyle('border: 1px solid #fff')
  })

  test('handles different color declaration formats', () => {
    const {queryByTestId} = render(`
      <span data-testid="color-example" style="color: rgba(0, 0, 0, 1); background-color: #000000">Hello World</span>
    `)

    expect(queryByTestId('color-example')).toHaveStyle('color: #000000')
    expect(queryByTestId('color-example')).toHaveStyle(
      'background-color: rgba(0, 0, 0, 1)',
    )
  })

  test('handles nonexistent styles', () => {
    const {container} = render(`
          <div class="label" style="background-color: blue; height: 100%">
            Hello World
          </div>
        `)

    expect(container.querySelector('.label')).not.toHaveStyle(
      'whatever: anything',
    )
  })

  test('handles styles as object', () => {
    const {container} = render(`
      <div class="label" style="background-color: blue; height: 100%">
        Hello World
      </div>
    `)

    expect(container.querySelector('.label')).toHaveStyle({
      backgroundColor: 'blue',
    })
    expect(container.querySelector('.label')).toHaveStyle({
      backgroundColor: 'blue',
      height: '100%',
    })
    expect(container.querySelector('.label')).not.toHaveStyle({
      backgroundColor: 'red',
      height: '100%',
    })
    expect(container.querySelector('.label')).not.toHaveStyle({
      whatever: 'anything',
    })
  })

  test('handles both with and without semicolon', () => {
    const {container} = render(`
      <div class="label" style="background-color: blue; height: 100%">
        Hello World
      </div>
    `)

    expect(container.querySelector('.label')).toHaveStyle('background-color: blue')
    expect(container.querySelector('.label')).toHaveStyle('background-color: blue;')
    expect(container.querySelector('.label')).toHaveStyle('height: 100%')
    expect(container.querySelector('.label')).toHaveStyle('height: 100%;')
  });

  test('handles shorthand property definitions', () => {
    const {container} = render(`
      <div class="example-shorthand" style="
        background: content-box radial-gradient(crimson, skyblue);
        border-bottom: thick double #32a1ce;
        transition: opacity 0.2s ease-out, top 0.3s cubic-bezier(1.175, 0.885, 0.32, 1.275);
      ">
        Hello World
      </div>
    `)

    const exampleShorthand = container.querySelector('.example-shorthand');

    expect(exampleShorthand).toHaveStyle(
      `
        background: content-box radial-gradient(crimson, skyblue);
        border-bottom: thick double #32a1ce;
        transition: opacity 0.2s ease-out, top 0.3s cubic-bezier(1.175, 0.885, 0.32, 1.275);
      `
    )

    expect(() =>
      expect(exampleShorthand).toHaveStyle(
        `
          background-clip: content-box;
          background-color: radial-gradient(crimson, skyblue);
        `
      )
    ).toThrowError()

    // Note: border-bottom seems to be an exception and does not throw an error
    //       when compared as longhand to a shorthand definition
    expect(exampleShorthand).toHaveStyle(
      `
        border-bottom-width: thick;
        border-bottom-style: double;
        border-bottom-color: #32a1ce;
      `
    )

    expect(() =>
      expect(exampleShorthand).toHaveStyle(
        'transition-duration: 0.2s;'
      )
    ).toThrowError()
  })

  test('handles longhand property definitions', () => {
    const {container} = render(`
      <div class="example-longhand">
        Hello World
      </div>
    `)

    const style = document.createElement('style')
    style.innerHTML =`
      .example-longhand {
        background-clip: content-box;
        background-color: 'radial-gradient(crimson, skyblue)';
        border-bottom-width: thick;
        border-bottom-style: double;
        border-bottom-color: #32a1ce;
        transition-property: opacity, top;
        transition-duration: 0.2s, 0.3s;
        transition-timing-function: ease-out, cubic-bezier(1.175, 0.885, 0.32, 1.275);
        transition-delay: 0.2s, 0.3s;
      }
    `

    document.body.appendChild(style)
    document.body.appendChild(container)

    const exampleLonghand = container.querySelector('.example-longhand');

    expect(exampleLonghand).toHaveStyle(`
      background-clip: content-box;
      background-color: 'radial-gradient(crimson, skyblue)';
      border-bottom-width: thick;
      border-bottom-style: double;
      border-bottom-color: #32a1ce;
      transition-property: opacity, top;
      transition-duration: 0.2s, 0.3s;
      transition-timing-function: ease-out, cubic-bezier(1.175, 0.885, 0.32, 1.275);
      transition-delay: 0.2s, 0.3s;
    `);

    expect(exampleLonghand).toHaveStyle(
        'background: content-box radial-gradient(crimson, skyblue);'
    )

    // Note: border-bottom does throw an error when comparing the longhand
    //       version to the shorthand version
    expect(() =>
      expect(exampleLonghand).toHaveStyle(
          'border-bottom: thick double #32a1ce;'
      )
    ).toThrowError()

    expect(() =>
      expect(exampleLonghand).toHaveStyle(
        'transition: opacity 0.2s ease-out, top 0.3s cubic-bezier(1.175, 0.885, 0.32, 1.275);'
      )
    ).toThrowError()
  });

  test('handles compound statements', () => {
    const {container} = render(`
      <div class="example-shorthand-multiple" style="
        transition: opacity 0.2s ease-out, top 0.3s cubic-bezier(1.175, 0.885, 0.32, 1.275);
      ">
        Hello World
      </div>
    `)

    expect(() =>
      expect(container.querySelector('.example-shorthand-multiple')).toHaveStyle(
      `transition-property: opacity;`
      )
    ).toThrowError()

    expect(() =>
        expect(container.querySelector('.example-shorthand-multiple')).toHaveStyle(
            `transition-property: top;`
        )
    ).toThrowError()

    expect(() =>
      expect(container.querySelector('.example-shorthand-multiple')).toHaveStyle(
  `
          transition-property: opacity;
          transition-duration: 0.2s;
          transition-timing-function: ease-out;
          transition-property: top;
          transition-duration: 0.3s;
          transition-timing-function: cubic-bezier(1.175, 0.885, 0.32, 1.275);
        `
      )
    ).toThrowError()
  })
})
