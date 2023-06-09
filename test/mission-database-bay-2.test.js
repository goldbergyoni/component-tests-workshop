// ✅ TASK: Spread your tests across multiple files, let the test runner invoke tests in multiple processes - Ensure all pass
// 💡 TIP: You might face port collision where two APIs instances try to open the same port
// 💡 TIP: Use the flag 'jest --maxWorkers=<num>'. Assign zero for max value of some specific number greater than 1

const request = require("supertest");

const nock = require('nock');
const {
    startWebServer,
    stopWebServer,
} = require('../src/entry-points/sensors-api');

const { getSensorEvent } = require('./test-helper');

let expressApp;

beforeAll(async () => {
    expressApp = await startWebServer();
});

afterAll(async () => {
    await stopWebServer();
});


beforeEach(() => {
    // 📗 Reading exercise: Why is this needed 👇? Read about npm/nock
    nock('http://localhost').post('/notification/default').reply(200, {
        success: true,
    });
});

describe('Sensors test 2', () => {

    // ✅ TASK: Test that when a new event is posted to /sensor-events route, the temperature is not specified -> the event is NOT saved to the DB!
    // 💡 TIP: Testing the response is not enough, the adequate state (e.g. DB) should also satisfy the expectation
    // 💡 TIP: In the assert phase, query to get the event that was (not) added - Ensure the response is empty

    test('When a new event is posted to /sensor-events route, the temperature is not specified -> the event is NOT saved to the DB!', async () => {
        const eventToAdd = getSensorEvent({ temperature : undefined });

        const addResult = await request(expressApp)
            .post('/sensor-events')
            .send(eventToAdd);

        const getAllResult = await request(expressApp)
            .get('/sensor-events')

        expect(addResult).toMatchObject({status: 400});
        expect(getAllResult.body).not.toMatchObject(expect.arrayContaining([
            expect.objectContaining({
                temperature: undefined
            })
        ]));
    });


    // ✅ TASK: Test that when an event is deleted, then its indeed not existing anymore
    test('When event is deleted, then its indeed not existing anymore', async () => {
        const eventToAdd = getSensorEvent();

        const addResult = await request(expressApp)
            .post('/sensor-events')
            .send(eventToAdd);

        const getAllResult = await request(expressApp)
            .get('/sensor-events')

        expect(getAllResult.body).toMatchObject(expect.arrayContaining([
            expect.objectContaining({
                id: addResult.body.id
            })
        ]))

        await request(expressApp)
            .delete(`/sensor-events/${addResult.body.id}`)
            .send(eventToAdd);

        const getAllResultAfterDelete = await request(expressApp)
            .get('/sensor-events')

        expect(getAllResultAfterDelete.body).not.toMatchObject(expect.arrayContaining([
            expect.objectContaining({
                id: addResult.body.id
            })
        ]))

    });


    // ✅ TASK: Write the following test below 👇 to check that the app is able to return all records
    // 💡 TIP: Checking the number of records in the response might be fragile as there other processes and tests
    //  that add data. Consider sampling for some records to get partial confidence that it works
    test('When adding multiple events, then all of them appear in the result', async () => {

        const eventToAdd = getSensorEvent();

        const eventToAddSecond = getSensorEvent();

        const addResult = await request(expressApp)
            .post('/sensor-events')
            .send(eventToAdd);

        const addResultSecond = await request(expressApp)
            .post('/sensor-events')
            .send(eventToAddSecond);

        const getAllResult = await request(expressApp)
            .get('/sensor-events')

        expect(getAllResult.body).toMatchObject(expect.arrayContaining([
            expect.objectContaining({
                id: addResult.body.id
            }),
            expect.objectContaining({
                id: addResultSecond.body.id
            })
        ]))
    });

})