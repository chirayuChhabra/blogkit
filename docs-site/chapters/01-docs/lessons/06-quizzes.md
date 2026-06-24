# Quizzes

## Creating a Quiz

Quizzes are authored in JSON format.

### JSON Fields Explained
The JSON file must conform to the following schema:

```json
{
  "questions": [
    {
      "q": "What does charge conservation mean?",
      "options": [
        "Charge can vanish", 
        "Total charge stays constant"
      ],
      "answer": 1,
      "explanation": "In an isolated system, total charge is conserved."
    }
  ]
}
```

*Note: The `answer` property is zero-indexed, meaning `0` corresponds to the first option, `1` to the second, and so on.*

## Embedding the Quiz
To embed a quiz, use the the image syntax tag in your `lesson.md`.

```html
![Test your knowledge!](../quizzes/sample.json)
```

*Live Example:*

![Test your knowledge!](../quizzes/sample.json)

<space size="2" />

## Generating Quizzes
You can also generate them via the CLI.

```bash
bunx md g quiz "My Quiz"
```
