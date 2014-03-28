PLUGINS= \
	channel9.zip \
	watchtv.zip \
	muzu.tv.zip \
	khanacademy.zip \
	videoco!pilot.zip \
	gametrailers.zip \
	navi-x.zip \
	oceanus.zip \
	youtube.zip \
	tmdb.zip

%.zip:
	@echo "Bundle plugin '$*'"
	@rm -f ./plugins/$*.zip
	@cd $*; zip -r9 ../plugins/$*.zip * -x *.js\~ > /dev/null; cd ..

all: ${PLUGINS}
