file=$1
clang -Wall -Wextra -Wpedantic -fsanitize=address -F /Library/Frameworks -g3 -O0 -std=c99 $file.c -framework OpenGl -framework SDL2_mixer -framework SDL2 -o a.out && ./a.out
