// this class utilizes the already built in class "Error"
class APIerror extends Error{
    constructor(
        statuscode,
        message = "An error occured!",
        errors = [],
        stack = "", //stack of error traces
    ){
        //utilizing the "Error" class
        super(message) // "super()" keyword calls the constructor of the parent class
        this.statuscode = statuscode
        this.data = null
        this.message = message
        this.success = false
        this.errors = errors

        // the stack is not always available, if it is available we'll add that
        if(stack) {
            this.stack = stack
        }
        else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export { APIerror }