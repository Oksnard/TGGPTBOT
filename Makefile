build:
	docker build -t tggptbot .

run:
	docker run -d -p 3000:3000 --name tggptbot --rm tggptbot