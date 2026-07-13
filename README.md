# Conway's Game of Life

An interactive, browser-based implementation of Conway's Game of Life. Draw cells, run or step simulations, load classic patterns, adjust speed and grid size, and share board states with a URL. Built with vanilla HTML, CSS, and JavaScript and deployable free with GitHub Pages.

## Features

- Click, touch, or drag to draw cells
- Play, pause, and advance one generation at a time
- Adjustable simulation speed and grid size
- Optional edge wrapping
- Random board generation
- Classic patterns: Glider, Blinker, Toad, Beacon, Pulsar, and Gosper glider gun
- Shareable links that preserve the current board
- Responsive design for desktop, tablet, and mobile
- No framework, build system, backend, account, or database required

## Run locally

Because this is a static site, you can open `index.html` directly in a browser. A local web server is also easy:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish it with GitHub Pages

1. Create a new GitHub repository, for example `conways-game-of-life`.
2. Upload all files from this project to the root of the repository.
3. Open the repository's **Settings**.
4. Select **Pages** in the left sidebar.
5. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
6. Select the `main` branch and the `/ (root)` folder, then click **Save**.
7. Your game will be available at:

```text
https://YOUR-GITHUB-USERNAME.github.io/conways-game-of-life/
```

Publishing can also be done from a terminal:

```bash
git init
git add .
git commit -m "Create Conway's Game of Life"
git branch -M main
git remote add origin https://github.com/YOUR-GITHUB-USERNAME/conways-game-of-life.git
git push -u origin main
```

After pushing, enable GitHub Pages using the repository settings described above.

## Customize the GitHub link

In `index.html`, replace this URL:

```html
https://github.com/
```

with the URL of your repository.

## How the simulation works

For each generation, every cell looks at its eight neighbors:

1. A live cell survives with two or three live neighbors.
2. A dead cell becomes alive with exactly three live neighbors.
3. Every other cell dies or remains dead.

## Project structure

```text
conways-game-of-life/
├── index.html
├── styles.css
├── script.js
├── README.md
├── LICENSE
└── .nojekyll
```

## License

MIT License. You may use, modify, and distribute this project freely.
