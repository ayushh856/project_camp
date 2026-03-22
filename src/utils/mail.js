import mailgen from "mailgen"
import nodemailer from "nodemailer"

// writing a method for sending the email on behalf of the data that the user gives
// this method is just preparing the email, we will write the methods for transporting the emails later
// somebody will give me options, a lot of data will come from the options 
const sendEmail = async (options) => {
    // initialising "mailgen" instance with default themes in brand
    // whatever we have written in the methods of creating verification and reset-password email are 
    //     just content, "mailgen" actually requires some default branding
    const mailGenerator = new mailgen({ // this code is just for putting the branding from mailgen
        theme: "default",
        product: {
            name: "Task Manager",
            link: "https://taskmanager.com"
        }
    })
    // now somebody will give me options and based on that options we will generate the email
    // generating email using the "mailGenerator" that we have created
    // "generatePlaintext" is like the if the client doesn't support html
    const textualEmail = mailGenerator.generatePlaintext(options.mailgenContent)
    // "generate" is all html based text
    const htmlEmail = mailGenerator.generate(options.mailgenContent)

    // creating the transporter object for sending, this method also takes options
    const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_SMTP_HOST,
        port: process.env.MAILTRAP_SMTP_PORT,
        auth: {
            user: process.env.MAILTRAP_SMTP_USER,
            pass: process.env.MAILTRAP_SMTP_PASS
        }
    })

    // creating a mail object
    const mail = {
        from: "mail.taskmanager@example.com", // email from where you are sending
        to: options.email, // receiver's email
        subject: options.subject,
        text: textualEmail, // text content is prepared by emailtextual
        html: htmlEmail // automatically browser client either will pick html if it supports it or else plain
    }
    // wrapping everything in the try-catch because email have the tendency to fail
    try {
        await transporter.sendMail(mail)
    } catch (error) {
        console.error(`Email servie failed! Make sure that you have provided the Mailtrap credentials in 
            the ".env" file`)
        console.error("Error: ", error)
    }
}

// generate mail for "email verification"
// this method will take two parameters, username and the verification url
const emailVerification = (username, emailVerificationUrl) => {
    // returning an object with the following body
    return {
        body: {
            name: username,
            intro: "Welcome to the app!",
            action: {
                instructions: "To verify your email, please click on the following button!",
                button: {
                    color: "#22BC66",
                    text: "Verify yourself!",
                    link: emailVerificationUrl
                }
            },
            outro: "Need help, or have any queries? Just reply to this email, we'd love to help!"
        }
    }
}

// generate mail for "forgot password"
const forgotPassword = (username, passwordResetUrl) => {
    // returning an object
    return {
        body: {
            name: username,
            intro: "We got a request to reset the password!",
            action: {
                instructions: "To reset the password click on the button!",
                button: {
                    color: "#22BC66",
                    text: "Reset password!",
                    link: passwordResetUrl
                }
            },
            outro: "Need help, or have any queries? Just ask in the email given below!"
        }
    }
}

export {
    emailVerification, forgotPassword, sendEmail,
}