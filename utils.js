const generateRandomNumber = (max) => {
    const min = 0;
    return Math.floor(Math.random() * max) + min;
}

module.exports.grabRandomWord = (words) => {
    const foundWordToShow = false;
    while (!foundWordToShow) {
        const generatedRandomNumber = generateRandomNumber(words.length);
        const chosenWord = words[generatedRandomNumber];
        const attempts = JSON.parse(chosenWord.attempts);

        if(attempts.length < 5){
            return chosenWord;
        } else if ((attempts.length >= 5) && (attempts[attempts.length - 1] === 0 || attempts[attempts.length - 2] === 0 || attempts[attempts.length - 3] === 0)) {
            return chosenWord;
        } 
    }
}
