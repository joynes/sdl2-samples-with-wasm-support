file=$1
clang -Wall -Wextra -Wpedantic -fsanitize=address -g3 -l SDL2-2.0.0 $file.c -framework OpenGl -o a.out && ./a.out 
