PAPER = main
TEX = $(wildcard *.tex)
BIB = reference.bib

.PHONY: all clean

$(PAPER).pdf: $(TEX)
	xelatex $(PAPER)
	xelatex $(PAPER)

clean:
	rm -f *.aux *.bbl *.blg *.log *.out $(PAPER).pdf *.dvi *.ps *.toc

