const { default: axios } = require("axios");
const nock = require("nock/types");

test("When campaign has two products, then the generated template is injected with these products", () => {
  // Arrange
  const templateId = addTemplate();
  const product1 = {};
  const product2 = {};
  const campaignData = { products: [product1, product2] , templateId};

  // Act
  const receivedResult = await axios.post('/content', campaignData);

  // Assert
  const specialString = receivedResult.specialString;
  expect(specialString).toContainMembers([product1, product2]);
});

test('When adding a new user, Then an email should be sent', () => {
  // Arrange
  const user = {name: 'Michael'}
  let emailRequest;
  nock('http://email.com').post('/new').reply(200, (url, request) => {
    emailRequest = request;
  })
  
  // Act
  axios.post('/user', user);
  
  // Assert
  expect(emailRequest).toMatchObject({
    subject: expect.any(String),
    body: expect.stringMatching(/welcome|user/),
  });
});
