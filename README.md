ftgplane
==========

version 0.1a

## Introduction ##

In contrast to an arbitrary scene WebGL scene renderer, ftgplane provides a simplified interface for projects that only need rendering of plane-aligned sprites.  These planes are typically aligned and Z-ordered.

Some applications include:

 + 2D style games on the web
 + Basis for GUI rendering in a WebGL canvas
 + 3D-ish websites
 
## Usage ##

The easiest way to check it out is to run the demo app.  Because the demo references textures, they need to be from somewhere other than the local filesystem.  The easiest thing to do is to use Python to serve them up via HTTP:

    cd ftgplane; python runserver.py

Simply browse to http://localhost:8000 and see the fireworks.

## A Word of Warning ##

This code is very much a work in progress. It does what it is supposed to do, but nothing impressive beyond that.  Seriously. It's really early.

## Contact ##

The main author is Michael Labbe <mike@frogtoss.com>.
