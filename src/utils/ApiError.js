class ApiError extends Error{
    constructor(
        statuscode,
        message="Something went wrong default message",
        errors = [],
        stack = ""
    ){
        super(message)
        this.statuscode = statuscode,
        this.message=message
        this.stack=stack,
        this.data=null,
        this.success=false,
        this.errors=errors

        if(stack){
            this.stack = stack
        }else{
            Error.captureStackTrace(this, this.constructor)
        }

    }
}

export {ApiError}