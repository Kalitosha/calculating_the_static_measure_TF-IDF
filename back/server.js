const { exec } = require("child_process");
const { promisify } = require("util");
const fs = require("fs");

lemmatization(10);

async function lemmatization(N) {
  let str = [];
  for (let i = 1; i <= N; i++) {
    str.push(
      `cd ./mystem & mystem.exe ..\\texts\\in-text${i}.txt ..\\texts\\text${i}.txt -l -n -d`
    );
  }
  //console.log(str);
  console.log("ОБРАБОТКА ФАЙЛОВ..");
  await Promise.all(
    str.map(str =>      
      promisify(exec)(str)
    )
  );
  console.log("ОБРАБОТКА ФАЙЛОВ ЗАВЕРШЕНА");
  workWithFiles();
}

function raznost(A, B) {// очистка от стоп-слов // разность множеств  
  diff = A.filter(x => !B.includes(x));
  return diff;
}

function countWords(arrWords) {// подсчет встречаемости каждого слова  
  var count = {};
  for (var i = 0; i < arrWords.length; i++) {
    count[arrWords[i]] = (count[arrWords[i]] || 0) + 1;
  }
  let map = new Map(Object.entries(count)); // приводим к адекватному типу
  const mapSort = new Map([...map.entries()].sort((a, b) => b[1] - a[1])); // сортируем, частовстречаемые вначале
  return mapSort;
}

function vectorLeksem(mapWords, N) {// выполняем функцию для каждой пары (ключ, значение) // убираем лишние слова  
  let arrayWords = [];
  for (let i = 0; i < 10; i++) {
    let j = 0;
    arrayWords[i] = [];
    for (let variable of mapWords[i].entries()) {
      if (j < N) {
        arrayWords[i].push(variable);
      } else {
        break;
      }
      j++;
    }
  }
  return arrayWords;
}

function countTextsWithTerm(files, naborLeksem) {
  numberEntries = [];
  for (let i = 0; i < naborLeksem.length; i++) {// первый набор лексем    
    numberEntries[i] = [];
    for (let j = 0; j < naborLeksem[i].length; j++) {// берем лексему      
      numberEntries[i][j] = [];
      for (file of files) {// идем по текстам        
        if (file.indexOf(naborLeksem[i][j][0]) !== -1) {// если лексема есть в тексте
          numberEntries[i][j]++;
        }
      }
    }
  }
  return numberEntries;
}

function TF_IDF(naborLeksem, totalWords, NumbTexts, numberEntries) {
  /* TF термина а = (Количество раз, когда термин а встретился в тексте / количество всех слов в тексте) */
  let TF = [];
  let IDF = [];
  let TFIDF = [];

  for (let text = 0; text < NumbTexts; text++) { // идем по текстам   
    
    TF[text] = [];
    IDF[text] = [];
    TFIDF[text] = [];
    console.log('______________________________');

    for (let value of naborLeksem[text].values()) {// идем по терминам текущего текста
      TF[text].push(value[1] / totalWords[text]); // считаем для каждого термина в рамках текущего текста
    }

    for (let j = 0; j < numberEntries.length; j++) { // идем по терминам     
    /* IDF термина а = логарифм( от Общего количества документов / Количество документов, в которых встречается термин а) */
      IDF[text].push(Math.log(NumbTexts / numberEntries[text][j])); // это мы считаем для каждого термина
    }

    for (let k = 0; k < numberEntries.length; k++) {// идем по терминам      
      TFIDF[text].push(TF[text][k] * IDF[text][k]);
      console.log(naborLeksem[text][k][0] + ": " + TFIDF[text][k]);
    }
   
  }
}

async function workWithFiles() {
  "use strict";
  let fileNames = [];
  for (let i = 1; i <= 10; i++) {
    fileNames.push(`texts/text${i}.txt`);
  }
  fileNames.push("mystem/mysor.txt");
  const files = await Promise.all(    
    fileNames
      // Метод map() создаёт новый массив с результатом вызова указанной функции для каждого элемента массива.
      .map(path =>
        promisify(fs.readFile)(path, { encoding: "utf8" })
      )
  );

  const mysor = files.pop();

  for (let i = 0; i < files.length; i++) {// делаем массивы слов    
    files[i] = files[i].split(/[,]|[\n]/);
  }

  for (let i = 0; i < files.length; i++) {// убираем конечные пробелы    
    for (let j = 0; j < files[i].length; j++) {
      files[i][j] = files[i][j].replace(/[?]*/g, "").trim();
    }
  }

  let arrCountWords = new Map(); // содержит слова и их частоту встречаемости
  for (let i = 0; i < files.length; i++) {
    files[i] = raznost(files[i], mysor); // убираем стоп-слова
    arrCountWords[i] = countWords(files[i]); // подсчитываем встречаемость каждого слова
  }

  let totalWords = []; // общее количество слов
  for (let i = 0; i < files.length; i++) {
    totalWords[i] = arrCountWords[i].size;
  }

  const naborLeksem = vectorLeksem(arrCountWords, 10); // удаляем лишние слова

  numberEntries = countTextsWithTerm(files, naborLeksem); // количество текстов с лексемой

  TF_IDF(naborLeksem, totalWords, 10, numberEntries);
}