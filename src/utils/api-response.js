// creating a class for the response
class APIresponse{
    constructor(statuscode, data, message = "Success") {
        this.statuscode = statuscode
        this.data = data
        this.message = message
        // anything above 400 is treated as a error 
        this.Success = statuscode < 400
    }
}

export { APIresponse }