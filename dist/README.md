# Cambridge Dictionary Plugin for RemNote

A RemNote plugin that integrates with Cambridge Dictionary to look up word definitions, pronunciation (IPA), audio, images, usage, and examples.

## Features

- **Search Word**: Look up any English word from Cambridge Dictionary
- **Import from URL**: Paste a Cambridge Dictionary URL to import a specific word
- **Import Wordlist**: Batch import words from your Cambridge Plus wordlists
- **Selected Text**: Select text in RemNote to instantly look up definitions
- **Powerup Properties**: Each word is stored with structured properties (Word, Grammar, Pronunciation, Definition, Meaning, Examples, Audio, Picture)

## Setup

### Cambridge Plus (Optional - for wordlist import)

To import wordlists from Cambridge Plus, you need to provide your session cookie:

1. Open [Cambridge Dictionary](https://dictionary.cambridge.org) in your browser
2. Sign in to your Cambridge Plus account
3. Open browser Developer Tools (F12 or Cmd+Option+I)
4. Go to the **Application** tab → **Cookies** → `dictionary.cambridge.org`
5. Copy the entire cookie string
6. Paste it into the plugin settings under "Cambridge Cookie"

## Usage

### Search Word
Use the command palette (Cmd/Ctrl + /) and type "Cambridge: Search Word" to look up a word.

### Import from URL
Use "Cambridge: Import from URL" to import definitions from a specific Cambridge Dictionary page.

### Import Wordlist
Configure your wordlist IDs in settings, then use "Cambridge: Import Wordlist" to batch import.

### Selected Text
Select any word in your notes to see Cambridge Dictionary definitions in the popup menu.
