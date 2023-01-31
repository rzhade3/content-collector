import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import joi = require("joi");
import { createHash } from "crypto";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const validLists = JSON.parse(process.env.VALID_LISTS || "[]")

    const emailSchema = joi.object({
        list: joi.string().valid(...validLists).required(),
        content: joi.string().email().required()
    });

    context.log('Request initiated.');
    const list = context.bindingData.list;
    const fullBody = {
        ...req.body,
        list: list,
    }
    const { error } = emailSchema.validate(fullBody);
    if (error) {
		context.log(error.details[0].message);
		context.res = {
			status: 400,
			body: "Invalid body"
		};
        return
	}
    const content = req.body.content;
    // To ensure no dupe emails, the ID is the hashed email + the list name
    const hash = createHash("sha256");
    hash.update(list + ':' + content)
    const id = hash.digest("hex");

    context.bindings.db = JSON.stringify({
        id: id,
        list: list,
        content: content
    })
    context.log("Successfully added new email.")
    context.res = {
        status: 200,
        body: "Successfully added."
    }
};

export default httpTrigger;
