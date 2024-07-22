x = 4
# Exercise 5: Odd or Even

# Objective: Determine if a number is odd or even.

# Description: Given a number, the program should print "Odd" if the number is odd, and "Even" if the number is even.

def odd_or_even(number):
    if number % 2 == 0:
        return "Even"
    else:
        return "Odd"

# Example usage
number = 4
result = odd_or_even(number)
print(f"The number {number} is {result}.")
