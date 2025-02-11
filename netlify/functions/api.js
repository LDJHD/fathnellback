// netlify/functions/api.js
exports.handler = async (event, context) => {
    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Hello from Node.js backend!' }),
    };
};
