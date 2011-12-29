#!/usr/bin/which

# 
# Copyright (C) 2012 Frogtoss Games, Inc. 
# 
# contact@frogtoss.com
# 

import SimpleHTTPServer
import SocketServer

if __name__ == '__main__':
    PORT = 8000
    handler = SimpleHTTPServer.SimpleHTTPRequestHandler

    # WebGL requires the mime type to be image/png, not image/x-png in
    # order to read a PNG into a texture.  This overrides the legacy
    # setting in SimpleHTTPServer. -ml
    handler.extensions_map['.png'] = 'image/png';


    httpd = SocketServer.TCPServer( ("", PORT), handler )
    
    print "Serving at port", PORT
    httpd.serve_forever()


