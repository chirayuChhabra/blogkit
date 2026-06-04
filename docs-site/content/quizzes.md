# Quizzes

Quizzes in Mr Markdown are an excellent way to keep lessons engaging and self-checking. They provide immediate interactive feedback when a reader selects an answer.

## Usage

To add a quiz, point the builder to a JSON file containing the questions:

```ts
.quiz("questions.json", {
  label: "Review questions",
  caption: "Immediate feedback keeps the lesson self-checking."
})
```

## JSON Format

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
