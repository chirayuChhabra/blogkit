import { course, chapter, lesson } from "../src";

course("Web Development 101", { theme: "light" })
	.description("A complete journey from HTML to modern frameworks")
	.chapter(
		chapter("Chapter 1: The Basics")
			.description("HTML, CSS, and basic scripting")
			.status("completed")
			.lesson(
				lesson("HTML Basics")
					.description("The skeleton of the web")
					.content("# HTML Basics\nHello World!")
			)
			.lesson(
				lesson("CSS Styling")
					.description("Making it look pretty")
					.content("# CSS\nColor it red.")
			)
	)
	.chapter(
		chapter("Chapter 2: Interactivity")
			.description("JavaScript fundamentals")
			.status("completed")
			.lesson(
				lesson("Intro to JS")
					.content("# JS\nVariables and loops")
			)
	)
	.chapter(
		chapter("Chapter 3: Advanced Frontend")
			.description("DOM Manipulation and async JS")
			.status("active")
			.lesson(
				lesson("DOM API")
					.content("# DOM\nDocument Object Model")
			)
	)
	.chapter(
		chapter("Chapter 4: React Basics")
			.description("Components and State")
			.status("locked")
			.lesson(
				lesson("Hello React")
					.content("# React\nComponents")
			)
	)
	.chapter(
		chapter("Chapter 5: Next.js")
			.description("Server-side rendering")
			.status("locked")
			.lesson(
				lesson("Next JS")
					.content("# Next\nSSR")
			)
	)
	.build();
