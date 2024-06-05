로직을 실질적으로 구현

```
export const createAccount = async (req, res) => {
  const { accountName, password, passwordCheck } = req.body;

  try {
    const existingAccount = await prisma.accounts.findFirst({
      where: {
        accountName: accountName,
      },
    });
    if (existingAccount) {
      throw new Error('이미 존재하는 계정입니다');
    }
    if (!vaildatePassword(password)) {
      throw new Error(
        '비밀번호 생성 조건이 잘못되었습니다. 6자리 이상, 숫자 ,영문 소문자 만 사용 가능합니다'
      );
    } else if (password !== passwordCheck) {
      throw new Error('비밀번호 확인이 올바르지 않습니다');
    }
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10); // 사용자가 입력한 password를 해싱하고 10자리 salt를 친다
    const newAccount = await prisma.accounts.create({
      data: {
        accountName: accountName,
        password: hashedPassword, //해싱된 password 사용
      },
      select: {
        accountName: true,
      },
    });

    res.status(201).json({ data: newAccount });
  } catch (error) {
    res
      .status(500)
      .json({ errorMessage: '계정생성에 문제가 발생했습니다' + error.message });
  }
};



```
