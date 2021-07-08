if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(function (error) {
        // registration failed
        console.log('Registration failed with ' + error);
    });
}

var currentQuestion = 0;
var correctAnswers = 0;
var questionIsAnswered = false;
var currentPlayerName = null;
const historyLimitPerQuiz = 30;
var selectedQuiz = null;
var quizList = {
    allQuiz: [],
    addQuiz: function (quiz) {
        this.allQuiz.push(quiz)
    },
    removeQuiz: function (quiz) {
        this.allQuiz = this.allQuiz.filter((eachQuiz) => eachQuiz.id !== quiz.id)
    },
}

const localStorageHandler = {
    updateQuizListSavedData: function () {
        localStorage.setItem('quizList', JSON.stringify(quizList.allQuiz));
    },
    loadSavedQuizListDataIfExists: function () {
        let quizListItems = localStorage.getItem('quizList');
        if (quizListItems) {
            quizList.allQuiz = JSON.parse(quizListItems);
        }
    }
};

window.onbeforeunload = function (e) {
    localStorageHandler.updateQuizListSavedData();
};

localStorageHandler.loadSavedQuizListDataIfExists();

document.getElementById('selectedQuiz').style.display = "none";

function removeQuestion(event) {
    selectedQuiz.questions = selectedQuiz.questions.filter((item, key) => key !== parseInt(event.target.parentNode.id));
    view.refreshQuestionList();
}

function movingToNextQuestion() {
    questionIsAnswered = false;
    if (currentQuestion + 1 < selectedQuiz.questions.length) {
        currentQuestion++;
        view.displayQuestion();
    } else {
        alert("Results  Correct " + correctAnswers + "/" + selectedQuiz.questions.length);
        if (selectedQuiz.history.length > historyLimitPerQuiz) {
            selectedQuiz.history = [];
        }
        selectedQuiz.history.push({
            playerName: currentPlayerName,
            correctAnswers: correctAnswers,
            totalAnswers: selectedQuiz.questions.length,
            createdAt: new Date()
        });
        location.reload();
    }
}

function addQuestion() {
    let questionInput = document.getElementById("questionInput");
    let correctInput = document.getElementById("correctInput");
    let wrongOneInput = document.getElementById("wrongOneInput");
    let wrongTwoInput = document.getElementById("wrongTwoInput");

    let question = {
        question: questionInput.value,
        correct: correctInput.value,
        wrongOne: wrongOneInput.value,
        wrongTwo: wrongTwoInput.value
    };

    for (let key in question) {
        if (question[key] === "" || question[key] === 'undefined') {
            alert('Please fill all input');
            return;
        }
    }
    selectedQuiz.questions.push(question);
    //upadate number of questions each time you add one

    //clear the inputs
    questionInput.value = "";
    correctInput.value = "";
    wrongOneInput.value = "";
    wrongTwoInput.value = "";
    view.refreshQuestionList();
    view.displayNumberOfQuestions();
}

var view = {
    //This runs when you click start quiz
    displayQuestion: function () {
        if (selectedQuiz.questions.length === 0) {
            alert('Your quiz has no questions');
            return;
        }

        //Hide the options to add questions and the info
        document.getElementById('quizInfo').style.display = "none"
        document.getElementById('addQuestions').style.display = "none"
        document.getElementById('quizList').style.display = "none"

        //Clear the quesitons wrapper
        var questionsWrapper = document.getElementById('questionsWrapper');

        questionsWrapper.innerHTML = "";

        //for each quesiton in array create elements neede and give classes
        let questionToShow = selectedQuiz.questions[currentQuestion];
        if (questionToShow) {
            let questionDiv = document.createElement("div");
            questionDiv.setAttribute("class", "questionDiv");
            let nextButton = document.createElement("button");
            nextButton.setAttribute("class", "nextButton");
            let question = document.createElement("p");
            let correctLi = document.createElement("li");
            correctLi.setAttribute("class", "correct");
            let wrongOneLi = document.createElement("li");
            wrongOneLi.setAttribute("class", "wrong");
            let wrongTwoLi = document.createElement("li");
            wrongTwoLi.setAttribute("class", "wrong");
            let numOfTotalQuestions = currentQuestion + 1;
            question.innerHTML = "<h5> Question : " + numOfTotalQuestions + "/" + selectedQuiz.questions.length + " " + questionToShow.question + "</h5>";
            correctLi.textContent = questionToShow.correct;
            wrongOneLi.textContent = questionToShow.wrongOne;
            wrongTwoLi.textContent = questionToShow.wrongTwo;

            //If its the last question the button should say finish if not it should say next
            if (currentQuestion + 1 === selectedQuiz.questions.length) {
                nextButton.textContent = "Finish";
            } else {
                nextButton.textContent = "Next";
            }

            //Append elements to div
            questionDiv.appendChild(question);

            //put the answers in a random order before apprending them so correct isnt always 1st
            var array = [correctLi, wrongOneLi, wrongTwoLi];
            array.sort(function (a, b) {
                return 0.5 - Math.random()
            });

            array.forEach(function (item) {
                item.addEventListener('click', function (event) {
                    view.checkAnswer(event);
                });
                questionDiv.appendChild(item);
            });
            nextButton.addEventListener('click', function () {
                movingToNextQuestion();
            });
            questionDiv.appendChild(nextButton);

            //add each question div to the question wrapper
            questionsWrapper.appendChild(questionDiv);

            questionsWrapper.firstChild.classList.add("is-active");
        }
    },
    refreshQuestionList: function () {
        if (selectedQuiz) {
            document.getElementById('questionList').innerHTML = "   <thead>" +
                "            <tr>" +
                "            <th scope='col'>Question</th>" +
                "            <th class='d-none d-sm-block' scope='col'>Correct Answer</th>" +
                "            <th class='d-none d-sm-block' scope='col'>Wrong Answer 1</th>" +
                "            <th class='d-none d-sm-block' scope='col'>Wrong Answer 2</th>" +
                "            <th class='' scope='col'>Action</th>" +
                "            </tr>" +
                "            </thead><tbody>" + selectedQuiz.questions.map(function (eachQuestion, key) {
                    return "<tr id='" + key + "'> <th>" + eachQuestion.question + "</th> <th class='d-none d-sm-block'>" + eachQuestion.correct + " </th> <th class='d-none d-sm-block'>" + eachQuestion.wrongOne + " </th> <th class='d-none d-sm-block'>" + eachQuestion.wrongTwo + " </th>" +
                        "<th class='btn-danger deleteQuestion'> Delete </th> </tr>"
                }).join('') + "</tbody>";

            let deleteQuestions = document.getElementsByClassName('deleteQuestion');
            Array.from(deleteQuestions).forEach(function (questionDelete) {
                questionDelete.addEventListener('click', function (event) {
                    removeQuestion(event);
                });
            });
        }
    },

    checkAnswer: function (event) {
        if (questionIsAnswered) {
            alert('You already chose an answer');
            return;
        }
        questionIsAnswered = true;
        if (event.target.className === 'correct') {
            event.target.style.background = 'green';
            correctAnswers++;
            document.getElementById('answersCorrect').innerHTML = correctAnswers + "/" + selectedQuiz.questions.length;
        } else {
            event.target.style.background = 'red';
        }
    },

    //count objects in array to show how many questions added to screen
    displayNumberOfQuestions: function () {
        document.getElementById("questionsNum-" + selectedQuiz.id).innerText = selectedQuiz.questions.length;
    }
}

document.getElementById('startQuiz').addEventListener('click', function () {
    let playerName = document.getElementById('playerName').value;
    if (playerName) {
        currentPlayerName = playerName;
    } else {
        alert('Please insert your nickname');
        return;
    }
    view.displayQuestion();
});

document.getElementById('submitQuestion').addEventListener('click', function () {
    addQuestion();
});


function selectQuiz(event) {
    selectedQuiz = quizList.allQuiz.filter((eachOfList) => parseInt(eachOfList.id) === parseInt(event.target.parentNode.id))[0];
    document.getElementById('selectedQuiz').style.display = "block";
    document.getElementById('allQuiz').style.display = "none";
    document.getElementById('quizTitle').innerHTML = "Quiz Title: " + selectedQuiz.name;
    view.refreshQuestionList();
    view.displayNumberOfQuestions();
}

function showAllQuiz() {
    document.getElementById('quizList').innerHTML = "   <thead>" +
        "            <tr>" +
        "            <th scope='col'>Quiz Name</th>" +
        "            <th class='d-none d-sm-block hidden-sm' scope='col'>Number Of Questions</th>" +
        "            <th scope='col'>Action</th>" +
        "            </tr>" +
        "            </thead><tbody>" + quizList.allQuiz.map(function (eachQuiz) {
            return "<tr> <th>" + eachQuiz.name + "</th> <th class='d-none d-sm-block hidden-sm' id='questionsNum-" + eachQuiz.id + "'>" + eachQuiz.questions.length + " </th><th id='" + eachQuiz.id + "' > <button id='selectQuiz__" + eachQuiz.id + "' class='btn btn-info selectQuizButton'> Select Quiz </button></th> </tr>"
        }).join('') + "</tbody>";

    document.querySelectorAll('.selectQuizButton').forEach(item => {
        item.addEventListener('click', function (event) {
            selectQuiz(event);
        });
    })
}

showAllQuiz();


document.getElementById('createNewQuiz').addEventListener('click', function () {
    // debugger;
    let newQuizTitle = document.getElementById('newQuizTitle');
    if (newQuizTitle.value) {
        let quiz = {};
        quiz.name = newQuizTitle.value;
        quiz.history = [];
        quiz.questions = [];
        quiz.id = (quizList.allQuiz.length > 0 ? parseInt(Math.max.apply(Math, quizList.allQuiz.map(function (eachQuiz) {
            return eachQuiz.id;
        }))) : 0) + 199;
        quizList.addQuiz(quiz);
        showAllQuiz();
        newQuizTitle.value = null;
    } else {
        alert('Please add a name to the quiz');
    }
});

document.getElementById('deleteQuiz').addEventListener('click', function () {
    quizList.removeQuiz(selectedQuiz);
    location.reload();
});

document.getElementById('quizListMenu').addEventListener('click', function () {
    location.reload();
})

function getCopyOfObject(object) {
    return object;
}

const leaderBoardHandler = {
    sortAndRenderLeaderboard : function (items, property, direction) {
        items.sort((history1, history2) => (history1.property > history2.property) ? -direction : ((history2.property > history1.property) ? -direction : 0));
        return items;
    },
    refreshLeaderboardData : function(sortBy = 'successPerc', direction = -1) {
        let globalLeaderBoardElement = document.getElementById('top10PlaysOfAllQuiz');
        let quizListTemp = getCopyOfObject(quizList);
        let allHistoryItems = quizListTemp.allQuiz.map(function (eachQuiz) {
            eachQuiz.history.map(function (historyItem) {
                historyItem.parentQuizName = eachQuiz.name
                historyItem.successPerc = (historyItem.correctAnswers / historyItem.totalAnswers) * 100;
                return historyItem;
            })
            return eachQuiz.history;
        }).flatMap((item) => item);

        allHistoryItems.sort((history1, history2) => (history1[sortBy] > history2[sortBy]) ? direction : ((history2[sortBy] > history1[sortBy]) ? -direction : 0));
        allHistoryItems.slice(0, 10);
        globalLeaderBoardElement.innerHTML = "<thead><tr> <th> Player Name </th> <th>Correct %</th><th class='d-none d-sm-block'>Quiz Name</th><th class='d-none d-sm-block'>Correct Answers</th> <th class='d-none d-sm-block'>Total Answers</th><th class='d-none d-sm-block'>Datetime</th></tr></thead>"
            + "<tbody>" + allHistoryItems.map(function (historyItem) {
                return `<tr> <th> ${historyItem.playerName} </th> <th>${historyItem.successPerc}%</th><th class="d-none d-sm-block">${historyItem.parentQuizName}</th><th class="d-none d-sm-block">${historyItem.correctAnswers}</th> <th class="d-none d-sm-block">${historyItem.totalAnswers}</th><th class="d-none d-sm-block">${historyItem.createdAt.toString()}</th></tr>`;
            }).join('') + "</tbody>"
    }
}
function sortAndRenderLeaderboard(items, property, direction) {
    items.sort((history1, history2) => (history1.property > history2.property) ? -direction : ((history2.property > history1.property) ? -direction : 0));
    return items;
}


leaderBoardHandler.refreshLeaderboardData();

Array.from(document.getElementsByClassName('sortDropdownOption')).forEach(function (questionDelete) {
    questionDelete.addEventListener('click', function (event) {
        let selectedSortingInfo = event.target.id.split('_', 2);

        leaderBoardHandler.refreshLeaderboardData(selectedSortingInfo[0], parseInt(selectedSortingInfo[1]));
    });
})



