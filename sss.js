import Joi from 'joi';

const passwordSchema = Joi.string()
  .pattern(new RegExp('^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9]{8,20}$')) // 영문자와 숫자를 포함하며, 길이는 8~20자
  .required();

passwordsToTest.forEach((password) => {
  const { error } = passwordSchema.validate(password);
  if (error) {
    console.log(`Password "${password}" is invalid:`, error.details[0].message);
  } else {
    console.log(`Password "${password}" is valid.`);
  }
});
