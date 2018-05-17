const { client } = require(`nightwatch-cucumber`);
const { defineSupportCode } = require(`cucumber`);

const deviceSizes = require(`../../helpers/device-sizes`);
const nestedSelector = require(`../../helpers/nested-selector`);
const page = require(`../../helpers/page`);
const resolveMockFile = require(`../../helpers/resolve-mock-file`);
const routes = require(`../../helpers/routes`);

const DEFAULT_WAIT_IN_MS = 500;

let networkStubs = [];

defineSupportCode(({ defineStep }) => {
  defineStep(/^the "(.*?)" query returns.*? `(.*?)`.*?$/, (queryType, name) => {
    const networkStub = {
      body: resolveMockFile({ queryType, name }),
      queryType,
    };

    if (page.loaded()) return client.execute(`addNetworkStub(${JSON.stringify(networkStub)})`);

    return networkStubs.push(networkStub);
  });

  defineStep(/^I (?:browse|open|visit).*? `(.*?)`$/, (routeName) => {
    const refresh = networkStubs.length;

    client.url(routes[routeName]);
    page.set(routes[routeName]);

    if (networkStubs.length) {
      // Fill the clients session storage
      // with network requests we want to
      // stub.
      client.execute(`sessionStorage.setItem('NETWORK_STUBS', '${JSON.stringify(networkStubs)}')`);
      networkStubs = [];
    }

    if (refresh) client.refresh();
  });

  defineStep(/^I (?:view).*? `(.*?)`.*?$/, deviceSize =>
    client.resizeWindow(...deviceSizes[deviceSize]));

  defineStep(/^I (?:pause).*? "(.*)"$/, delay => client.pause(delay));

  defineStep(/^I (?:find|identify|see|spot).*? (`.*`).*?$/, selectorChain =>
    client.expect.element(nestedSelector(selectorChain)).to.be.visible);

  defineStep(/^I (?:can|don)'t (?:find|identify|see|spot).*? (`.*`).*?$/, selectorChain =>
    client.expect.element(nestedSelector(selectorChain)).to.not.be.visible);

  defineStep(/^I (?:expect).*? (`.*`).*? to be present$/, selectorChain =>
    client.expect.element(nestedSelector(selectorChain)).to.be.present);

  defineStep(/^I (?:expect) the text.*? "(.*?)".*? to be present$/, text =>
    client.useXpath().expect.element(`//*[contains(text(), '${text}')]`).to.be.present.before(DEFAULT_WAIT_IN_MS));

  defineStep(/^I (?:expect).*? (`.*`).*? to not be present$/, selectorChain =>
    client.expect.element(nestedSelector(selectorChain)).to.not.be.present);

  defineStep(/^I (?:enter|input|supply|type).*? "(.*?)" in.*? (`.*`)$/, (value, selectorChain) =>
    client.setValue(nestedSelector(selectorChain), value));

  defineStep(/^I (?:activate|click).*? (`.*`)$/, selectorChain =>
    client.click(nestedSelector(selectorChain)));

  defineStep(/^I (?:expect).*? (`.*`) (?:in|with) "(.*?)" (?:modifier|variant|status)$/, (selectorChain, variant) =>
    client.expect
      .element(`
                ${nestedSelector(selectorChain)}[class*="--${variant}"],
                ${nestedSelector(selectorChain)}[class*="is-${variant}"]
            `)
      .to.be.present);

  defineStep(/^I (?:expect).*? (`.*`) (?:with) "(.*?)" (?:state)$/, (selectorChain, state) =>
    client.expect
      .element(`${nestedSelector(selectorChain)}:${state}`)
      .to.be.present);

  defineStep(/^I (?:expect).*? `(.*?)`.*? opens$/, routeName =>
    client.assert.urlEquals(routes[routeName]));
});
