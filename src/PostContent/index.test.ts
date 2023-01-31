import httpTrigger from ".";
import { createHash } from "crypto";

class FakeContext {
	bindings: any = {};
	bindingData: any;
	log: any;

	invocationId: string;
	executionContext: any;
	done: any;
	traceContext: any;
	bindingDefinitions: any;

	res: any = {}

	constructor() {
		this.log = jest.fn();
	}
}

class FakeRequest {
	body: any;
}

describe("PostContent", () => {
	let env: any;

	beforeEach(() => {
		env = process.env;
		process.env.VALID_LISTS = JSON.stringify(["testlist"]);
	});

	afterEach(() => {
		process.env = env;
	});

	test("should return 400 if id is invalid", async () => {
		const fakeContext = new FakeContext();
		fakeContext.bindingData = {
			list: "invalid"
		};
		const fakeRequest = new FakeRequest();
		fakeRequest.body = {
			content: "foo@example.com"
		};
		await httpTrigger(fakeContext, fakeRequest);
		expect(fakeContext.log).toBeCalledWith("Request initiated.");
		expect(fakeContext.log).toBeCalledWith(expect.stringContaining('"list" must be [testlist]'));
		expect(fakeContext.bindings.db).toBeUndefined();
		expect(fakeContext.res.status).toBe(400);
	});

	test("should return 400 if content is invalid", async () => {
		const fakeContext = new FakeContext();
		fakeContext.bindingData = {
			list: "testlist"
		};
		const fakeRequest = new FakeRequest();
		fakeRequest.body = {
			content: "not an email"
		};
		await httpTrigger(fakeContext, fakeRequest);
		expect(fakeContext.log).toBeCalledWith("Request initiated.");
		expect(fakeContext.log).toBeCalledWith(expect.stringContaining('"content" must be a valid email'));
		expect(fakeContext.bindings.db).toBeUndefined();
		expect(fakeContext.res.status).toBe(400);
	});

	test("should return 200 if content is valid", async () => {
		const fakeContext = new FakeContext();
		fakeContext.bindingData = {
			list: "testlist"
		};
		const fakeRequest = new FakeRequest();
		fakeRequest.body = {
			content: "foo@example.com"
		};
		const expectedHash = createHash("sha256");
		expectedHash.update("testlist:foo@example.com");
		const expectedId = expectedHash.digest("hex");

		await httpTrigger(fakeContext, fakeRequest);
		expect(fakeContext.log).toBeCalledWith("Request initiated.");
		expect(fakeContext.log).toBeCalledWith('Successfully added new email.');

		expect(fakeContext.bindings.db).toBe(JSON.stringify({
			id: expectedId,
			list: "testlist",
			content: "foo@example.com"
		}));
		expect(fakeContext.res.status).toBe(200);
	});
});
