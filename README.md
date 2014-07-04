# Voka

Reliabe pub-sub broker, using Redis and Nodejs


## Notes

1. `hiredis` doesn't compile in node v0.11.x, so pure javascript implementation is used
2. For back-compatibilities, traditional promise-based style is used