# COMPLETE C++ INTERVIEW PREPARATION SYSTEM
## For Software Developers (2-3 YOE)


# TABLE OF CONTENTS

1. How to Think in Interviews
2. Phase 1: C++ Language Fundamentals
3. Phase 2: Arrays & String Problem Solving
4. Phase 3: Linear Data Structures
5. Phase 4: Non-Linear DS + Graph Thinking
6. Phase 5: Recursion + Advanced Patterns
7. Phase 6: Greedy + Optimization
8. Phase 7: Advanced Data Structures
9. Phase 8: Operating Systems
10. Phase 9: Computer Networks
11. Phase 10: System Design
12. Phase 11: Threading Interview Problems
13. Phase 12: Top 25 Must-Know Algorithms
14. Phase 13: Interview Implementation Drills
15. Phase 14: Linux Commands for Developers
16. General Reference
17. Top 50 Must-Do Questions
18. Final Revision Sheet

---

# HOW TO THINK IN INTERVIEWS

## Step-by-Step Problem-Solving Framework

### 1. UNDERSTAND
- Restate the problem in your own words
- Ask clarifying questions (constraints, input range, special cases)
- Identify what "solve" means (return value, side effects)
- Example edge cases: empty input, single element, duplicates, negative numbers

### 2. EXAMPLES
- Work through 2-3 examples by hand
- Include at least one edge case
- Trace the example step by step
- Note any patterns you observe

### 3. BRUTE FORCE
- State the obvious O(n²) or O(n³) solution FIRST
- Don't optimize prematurely
- Show you can solve it correctly before optimizing
- Explain why it works

### 4. OPTIMIZE
- Apply patterns: two pointers, sliding window, hash map, sorting, binary search, stack/monotonic, BFS/DFS, DP
- Discuss time and space trade-offs
- Consider multiple approaches
- Pick the best balance for the constraints

### 5. CODE
- Write clean, readable code
- Use meaningful variable names
- Handle edge cases
- Add comments for non-obvious logic

### 6. TEST
- Trace through code with your examples
- Check off-by-one errors
- Verify edge cases
- Test any loops and conditionals

## Communication Tips

- **Think out loud** — narrate your thought process so interviewer can help
- **Ask clarifying questions** before diving into code
- **Discuss trade-offs** (time vs space, correctness vs simplicity)
- **If stuck**, explain your thinking, mention approaches you've considered
- **Test your code** with examples, including edge cases
- **Confirm** before coding (e.g., "Does this approach sound good?")

## Pattern Recognition Cheat Sheet

| Problem Pattern | Technique | Example |
|-----------------|-----------|---------|
| "Find pair/target sum" | Hash map or two pointers | Two Sum |
| "Longest/shortest substring/subarray" | Sliding window | Longest substring without repeating |
| "Next greater/smaller element" | Monotonic stack | Next Greater Element |
| "Parentheses/bracket matching" | Stack | Valid Parentheses |
| "Sorted array, find target" | Binary search | Search in Rotated Array |
| "Shortest path in unweighted graph" | BFS | Number of Islands |
| "All paths/combinations" | DFS/Backtracking | Permutations, N-Queens |
| "Count ways/min cost" | Dynamic Programming | Coin Change, LIS |
| "Overlapping subproblems" | Memoization/DP | Fibonacci, Longest Common Subsequence |
| "Interval scheduling" | Greedy + sorting | Merge Intervals, Minimum Meeting Rooms |
| "Top K elements" | Heap | Kth Largest Element |
| "Prefix relationships" | Prefix sum or DP | Subarray Sum Equals K |
| "Connected components" | Union-Find or DFS | Number of Connected Components |
| "Tree traversal" | DFS/BFS or recursion | Inorder, Level Order, LCA |

---

# PHASE 1: C++ LANGUAGE FUNDAMENTALS

## 1. C++ Core for Interviews

### Key Concepts

#### Rule of 0/3/5/6
- **Rule of 0**: Don't write any special member functions (let compiler generate)
- **Rule of 3**: If you write destructor, copy constructor, or copy assignment, write all three
- **Rule of 5**: Add move constructor and move assignment to rule of 3
- **Rule of 6**: Add default constructor

```cpp
class MyClass {
    int* data;
public:
    // Default
    MyClass() : data(nullptr) {}

    // Destructor (cleanup)
    ~MyClass() { delete data; }

    // Copy constructor
    MyClass(const MyClass& other) {
        if (other.data) {
            data = new int(*other.data);
        } else {
            data = nullptr;
        }
    }

    // Copy assignment
    MyClass& operator=(const MyClass& other) {
        if (this == &other) return *this;
        delete data;
        if (other.data) {
            data = new int(*other.data);
        } else {
            data = nullptr;
        }
        return *this;
    }

    // Move constructor
    MyClass(MyClass&& other) noexcept : data(other.data) {
        other.data = nullptr;
    }

    // Move assignment
    MyClass& operator=(MyClass&& other) noexcept {
        if (this == &other) return *this;
        delete data;
        data = other.data;
        other.data = nullptr;
        return *this;
    }
};
```

#### Copy vs Move Semantics
- **Copy**: Deep copy of resources, expensive (O(n))
- **Move**: Transfer ownership, cheap (O(1) pointer swap)
- **std::move**: Casts to rvalue reference, doesn't move by itself
- **Perfect forwarding**: Use `std::forward` in templates to preserve lvalue/rvalue

```cpp
// Move doesn't happen unless move constructor/assignment exists
vector<int> v1 = {1,2,3};
vector<int> v2 = std::move(v1);  // v1 now empty, O(1)

// std::move is just a cast
int x = 5;
int y = std::move(x);  // x is still 5! (ints don't have move semantics benefit)
```

#### RAII (Resource Acquisition Is Initialization)
- Acquire resources in constructor
- Release resources in destructor
- Exception-safe by design
- Example: file handles, locks, memory

```cpp
class FileHandle {
    FILE* file;
public:
    FileHandle(const char* path) {
        file = fopen(path, "r");
        if (!file) throw runtime_error("Failed to open");
    }
    ~FileHandle() {
        if (file) fclose(file);  // Always cleaned up
    }
};

// Even if exception thrown, destructor called and resource freed
```

#### Smart Pointers
- **unique_ptr**: sole ownership, move-only, no overhead
- **shared_ptr**: shared ownership, reference counted, thread-safe counting
- **weak_ptr**: non-owning reference to shared_ptr, breaks cycles

```cpp
// unique_ptr
unique_ptr<int> p1(new int(10));
unique_ptr<int> p2 = std::move(p1);  // p1 is now nullptr
// p2 deleted automatically when out of scope

// shared_ptr
shared_ptr<int> sp1 = make_shared<int>(20);
shared_ptr<int> sp2 = sp1;  // Reference count = 2
// Both out of scope, count = 0, deleted

// weak_ptr (breaks cycle)
class Node {
    shared_ptr<Node> next;
    weak_ptr<Node> prev;  // Doesn't increment ref count
};
```

#### Virtual Functions & Virtual Destructor
- Virtual function: can be overridden in derived class
- Virtual destructor: MUST if base class will be deleted via base pointer
- Without virtual destructor: derived destructor not called → memory leak

```cpp
class Base {
public:
    virtual void func() { cout << "Base\n"; }
    virtual ~Base() {}  // MUST be virtual!
};

class Derived : public Base {
public:
    void func() override { cout << "Derived\n"; }  // override keyword is helpful
    ~Derived() { /* cleanup */ }
};

Base* p = new Derived();
p->func();  // Calls Derived::func
delete p;   // Calls Derived::~Derived because of virtual
```

#### Object Slicing
- Assigning derived object to base object copies only base part
- Always pass by pointer/reference to avoid slicing

```cpp
class Base { int b; };
class Derived : public Base { int d; };

Derived obj;
Base copy = obj;  // SLICING! d field lost
Base& ref = obj;  // OK, no slicing
Base* ptr = &obj; // OK, no slicing
```

#### const Correctness
- Read pointer and const declarations right-to-left
- `const int*`: pointer to const int (can't modify int)
- `int* const`: const pointer to int (can't move pointer)
- `const int* const`: const pointer to const int (can't modify either)
- Const member function: can't modify member variables

```cpp
const int x = 5;
int const y = 5;  // Same as above

const int* p1 = &x;     // Can't modify *p1
int* const p2 = &y;     // Can't modify p2
const int* const p3 = &x;  // Can't modify either

class MyClass {
    int value;
public:
    int getValue() const { return value; }  // Can't modify value
    void setValue(int v) { value = v; }     // Can modify value
};

const MyClass obj;
obj.getValue();  // OK, calls const version
obj.setValue(5); // ERROR, setValue not const
```

#### static_cast vs dynamic_cast
- **static_cast**: compile-time cast, no runtime check, programmer responsible
- **dynamic_cast**: runtime check, returns nullptr if invalid, for polymorphic types

```cpp
double d = 3.14;
int i = static_cast<int>(d);  // OK, but your responsibility

Base* b = getBasePtr();
Derived* d = dynamic_cast<Derived*>(b);  // NULL if b not actually Derived
if (d) { /* use d */ }  // Safe
```

#### Exception Safety Guarantees
- **No-throw**: never throws (e.g., destructors should be noexcept)
- **Strong**: all-or-nothing (either fully succeeds or rolls back)
- **Basic**: operation may fail, but no memory leak or invalid state
- **Weak**: only guarantee valid state

```cpp
void func() noexcept {  // Promises not to throw
    // ...
}

// Strong exception safety example
class List {
    void push(const T& val) {
        Node* newNode = new Node(val);  // May throw
        try {
            link(newNode);
        } catch (...) {
            delete newNode;  // Rollback
            throw;
        }
    }
};
```

#### Iterator Invalidation
- **Vector**: insert/erase/resize invalidates all iterators at/after position
- **Deque**: insert/erase only invalidates at/after position (not before)
- **List**: only invalidates erased element
- **HashMap**: rehashing invalidates all iterators

```cpp
vector<int> v = {1,2,3,4,5};
auto it = v.begin();
it++;  // Points to 2
v.insert(v.begin(), 0);  // Invalidates ALL iterators
// it now invalid! Undefined behavior if used
```

#### Templates (Header-Based)
- Template definitions must be in header files (or included in .cpp)
- Reason: instantiation happens at compile time, needs full definition
- Specialization can go in .cpp but must be explicit instantiation

```cpp
// Must be in header
template<typename T>
void swap(T& a, T& b) {
    T temp = a; a = b; b = temp;
}

// Explicit template instantiation (in .cpp)
template void swap<int>(int&, int&);
```

### Pattern Recognition

**When to use virtual functions:**
- Different derived classes need different behavior
- Base pointer/reference will call the function
- Think "polymorphism" and "interface"

**When to use smart pointers:**
- Always in modern C++
- unique_ptr: single owner
- shared_ptr: multiple owners or uncertain ownership

**When to apply const:**
- Function doesn't modify state → const member function
- Parameter won't be modified → const parameter
- Variable never changes → const

**When RAII is important:**
- Any resource (file, lock, memory, connection)
- Guarantees cleanup even if exception thrown
- No manual cleanup needed

### Key Interview Questions

- [ ] Explain the Rule of 5 with code example
- [ ] What is RAII and why is it important?
- [ ] Difference between unique_ptr and shared_ptr
- [ ] Why must base class have virtual destructor?
- [ ] What is object slicing and how to prevent it?
- [ ] Explain copy vs move semantics
- [ ] What does std::move actually do?
- [ ] Const correctness: explain `const int* const p`
- [ ] When to use static_cast vs dynamic_cast?
- [ ] Explain exception safety guarantees

---

## 2. Pointers

### Key Concepts

#### Memory Layout
```
High Address
┌─────────────────────┐
│   Command Line      │
│   Env Variables     │
├─────────────────────┤
│       STACK         │ (local variables, function parameters)
│         ↓           │ (grows downward)
├─────────────────────┤
│                     │
│   (unused space)    │
│                     │
├─────────────────────┤
│       HEAP          │ (dynamic memory, grows upward)
│         ↑           │ (malloc/new)
├─────────────────────┤
│ BSS (uninitialized) │
├─────────────────────┤
│ DATA (initialized)  │ (global/static vars)
├─────────────────────┤
│  CODE (read-only)   │ (instructions)
└─────────────────────┘
Low Address
```

#### Pointer Syntax (Read Right to Left)
```cpp
int x = 5;

int* p;              // pointer to int
const int* p;        // pointer to const int (can't modify *p)
int* const p;        // const pointer to int (can't modify p)
const int* const p;  // const pointer to const int

int** pp;            // pointer to pointer to int
int* arr[10];        // array of 10 pointers to int
int (*arr)[10];      // pointer to array of 10 ints
int (*func)(int);    // pointer to function taking int, returning int
```

#### Dynamic Memory
```cpp
// Single allocation
int* p = new int;           // uninitialized
int* p = new int(5);        // initialized to 5
delete p;
p = nullptr;  // Good practice

// Array allocation
int* arr = new int[10];
delete[] arr;  // Note: delete[], not delete

// 2D array
int** matrix = new int*[rows];
for (int i = 0; i < rows; i++) {
    matrix[i] = new int[cols];
}
// Cleanup
for (int i = 0; i < rows; i++) delete[] matrix[i];
delete[] matrix;

// Better: use vector
vector<vector<int>> matrix(rows, vector<int>(cols));
```

#### Function Pointers & Callbacks
```cpp
// Function pointer declaration
int (*funcPtr)(int, int);  // Points to function taking 2 ints, returning int

// Assign function
int add(int a, int b) { return a + b; }
funcPtr = add;  // or funcPtr = &add;

// Call through pointer
int result = funcPtr(3, 4);  // or (*funcPtr)(3, 4);

// Callback example
void process(int arr[], int size, int (*callback)(int)) {
    for (int i = 0; i < size; i++) {
        arr[i] = callback(arr[i]);
    }
}

int square(int x) { return x * x; }
int numbers[] = {1, 2, 3};
process(numbers, 3, square);
```

### Quick Reference Table

| Syntax | Meaning |
|--------|---------|
| `int* p` | pointer to int |
| `const int* p` | pointer to const int |
| `int* const p` | const pointer to int |
| `const int* const p` | const pointer to const int |
| `int** p` | pointer to pointer |
| `int* arr[10]` | array of pointers |
| `int (*p)[10]` | pointer to array |
| `int (*f)(int)` | pointer to function |
| `new int` | allocate on heap |
| `delete p` | deallocate single |
| `delete[] p` | deallocate array |
| `p->member` | member via pointer |
| `(*p).member` | same as above |

### Problems

#### Easy (All 10)
- [ ] Swap two variables using pointers
- [ ] Find the larger of two numbers using pointers
- [ ] Reverse an array using pointers
- [ ] Count occurrences of a character in a string
- [ ] Find sum of all elements in an array using pointers
- [ ] Compare two strings using pointers
- [ ] Multiply two numbers and store result via pointer
- [ ] Create a simple 2D array dynamically
- [ ] What's the size of a pointer? (pointer size question)
- [ ] Pointer arithmetic: increment pointer in loop

#### Medium (All 10)
- [ ] Implement a simple function pointer callback system
- [ ] Create a matrix dynamically and print it
- [ ] Pass function pointer to a sorting function
- [ ] Implement dynamic array resize
- [ ] Pointer to pointer usage for 2D arrays
- [ ] Implement a simple linked list node with pointers
- [ ] Function pointer array for dispatch table
- [ ] Memory leak detection exercise
- [ ] Dangling pointer example and fix
- [ ] void* pointer type casting

#### Hard (All 10)
- [ ] Implement a custom allocator
- [ ] Double indirection for dynamic 2D arrays
- [ ] Complex pointer declarations (decode them)
- [ ] Function pointer with variable arguments
- [ ] Memory pool implementation with pointers
- [ ] Pointer to member function
- [ ] Implement placement new
- [ ] Smart pointer implementation (simplified)
- [ ] Circular buffer using pointers
- [ ] Memory alignment and pointer arithmetic

---

## 3. Structs, Enums & Unions

### Key Concepts

#### Struct vs Class
```cpp
struct Point {  // Default public access
    int x, y;
};

class MyClass {  // Default private access
    int x;
public:
    void setX(int val) { x = val; }
};

Point p;
p.x = 5;  // OK, public

MyClass obj;
obj.x = 5;  // ERROR, private
```

#### Operator Overloading
```cpp
struct Complex {
    double real, imag;

    // Binary operator
    Complex operator+(const Complex& other) const {
        return {real + other.real, imag + other.imag};
    }

    // Unary operator
    Complex operator-() const {
        return {-real, -imag};
    }

    // Comparison
    bool operator==(const Complex& other) const {
        return real == other.real && imag == other.imag;
    }

    // Stream output
    friend ostream& operator<<(ostream& os, const Complex& c) {
        os << c.real << " + " << c.imag << "i";
        return os;
    }

    // Increment
    Complex& operator++() {  // Pre-increment
        real++; imag++;
        return *this;
    }

    Complex operator++(int) {  // Post-increment (int dummy)
        Complex temp = *this;
        real++; imag++;
        return temp;
    }
};

Complex c1{1, 2}, c2{3, 4};
Complex c3 = c1 + c2;
cout << c3;  // Uses operator<<
```

#### Bit Fields
```cpp
struct Flags {
    unsigned int flag1 : 1;   // 1 bit
    unsigned int flag2 : 1;   // 1 bit
    unsigned int count : 6;   // 6 bits
    // Total: 8 bits (1 byte)
};

Flags f;
f.flag1 = 1;
f.count = 32;
```

#### Enum vs Enum Class
```cpp
enum Color { RED, GREEN, BLUE };      // Unscoped
enum class Status { PENDING, DONE };  // Scoped (C++11)

// Unscoped enum - pollutes namespace
Color c = RED;  // OK

// Scoped enum - must use Status::
Status s = Status::PENDING;  // OK
Status s = PENDING;          // ERROR

// Enum with underlying type
enum class HttpStatus : unsigned char {
    OK = 200,
    NOT_FOUND = 404,
    SERVER_ERROR = 500
};
```

#### Union (One Member at a Time)
```cpp
union Data {
    int intVal;
    float floatVal;
    char charVal;
    // Only ONE can have a value at a time
    // All share same memory location
};

Data d;
d.intVal = 10;
cout << d.intVal;    // 10
d.floatVal = 3.14;   // Overwrites intVal
cout << d.intVal;    // Garbage or unexpected value

// Size = size of largest member
cout << sizeof(Data);  // 4 (size of int or float)
```

#### Tagged Union / std::variant (C++17)
```cpp
#include <variant>

struct Dog { string name; };
struct Cat { string name; };

variant<Dog, Cat> pet = Dog{"Buddy"};

// Access with get
if (auto dog = get_if<Dog>(&pet)) {
    cout << dog->name;
}

// Visit pattern
visit([](const auto& animal) {
    cout << animal.name;
}, pet);
```

### Quick Reference Table

| Concept | Usage | Key Point |
|---------|-------|-----------|
| struct | default public, POD | aggregate type |
| class | default private | encapsulation |
| operator+ | binary operator | returns new object |
| operator[] | subscript | often ref return |
| operator() | functor/function object | callable |
| enum | enumeration | constants |
| enum class | scoped enum (C++11) | type safe |
| union | overlapping members | memory efficient |
| variant | type-safe union (C++17) | tagged union |

### Problems

#### Easy (All 10)
- [ ] Create a Point struct with overloaded operators (+, -)
- [ ] Implement operator== for a struct
- [ ] Create an enum for days of week
- [ ] Print enum values
- [ ] Overload operator<< for custom struct
- [ ] Create a struct with const member
- [ ] Difference between struct and class default access
- [ ] Simple operator+ overload
- [ ] Create enum class with underlying type
- [ ] Union vs struct memory size

#### Medium (All 10)
- [ ] Overload operator[] for custom array
- [ ] Implement operator++ and operator--
- [ ] Create a functor (operator()) for sorting
- [ ] Overload operator() for function object
- [ ] Comparison operators (<, >, <=, >=)
- [ ] Conversion operator (operator int, etc.)
- [ ] Assignment operator overload
- [ ] Stream input with operator>>
- [ ] Bitwise operators overload
- [ ] Move semantics in operator=

#### Hard (All 10)
- [ ] Chain operator overloads (e.g., a + b + c)
- [ ] Overload operator new/delete
- [ ] Implement operator* for complex multiplication
- [ ] Proxy object pattern
- [ ] Expression templates (CRTP)
- [ ] operator-> for smart pointer-like behavior
- [ ] Overload cast operator (explicit vs implicit)
- [ ] const vs non-const operator overloading
- [ ] Friend functions and operator overloading
- [ ] Variadic operator() templates

---

## 4. Templates

### Key Concepts

#### Function Templates
```cpp
// Simple function template
template<typename T>
T max(T a, T b) {
    return (a > b) ? a : b;
}

// Usage
max(5, 3);           // T = int
max(3.14, 2.71);     // T = double
max(string("a"), string("b"));  // T = string

// Multiple template parameters
template<typename T, typename U>
auto add(T a, U b) {
    return a + b;  // Return type deduced (C++14)
}

// Template with default parameter
template<typename T = int>
void print(T val) {
    cout << val;
}
print();     // Uses int
print(3.14); // Uses double
```

#### Class Templates
```cpp
template<typename T>
class Stack {
    vector<T> data;
public:
    void push(const T& val) { data.push_back(val); }
    T pop() { T val = data.back(); data.pop_back(); return val; }
    bool empty() const { return data.empty(); }
};

// Usage
Stack<int> intStack;
intStack.push(5);

Stack<string> stringStack;
stringStack.push("hello");

// Multiple template parameters
template<typename K, typename V>
class Map {
    // ...
};

Map<string, int> wordCount;
```

#### Template Specialization

**Full Specialization:**
```cpp
// General template
template<typename T>
class Printer {
public:
    void print(T val) { cout << "Generic: " << val << "\n"; }
};

// Full specialization for bool
template<>
class Printer<bool> {
public:
    void print(bool val) { cout << "Boolean: " << (val ? "true" : "false") << "\n"; }
};

Printer<int> p1;
p1.print(42);    // Generic: 42

Printer<bool> p2;
p2.print(true);  // Boolean: true
```

**Partial Specialization:**
```cpp
// General template
template<typename T>
class Container { };

// Partial specialization for pointers
template<typename T>
class Container<T*> {
    // Specialized for pointer types
};

// Partial specialization for vectors
template<typename T>
class Container<vector<T>> {
    // Specialized for vectors
};

Container<int> c1;          // Uses general template
Container<int*> c2;         // Uses pointer specialization
Container<vector<int>> c3;  // Uses vector specialization
```

#### Variadic Templates (C++11)
```cpp
// Base case
template<typename T>
void print(T val) {
    cout << val << " ";
}

// Recursive case
template<typename T, typename... Args>
void print(T first, Args... rest) {
    cout << first << " ";
    print(rest...);  // Recursion
}

print(1, 2.5, "hello", true);  // Prints: 1 2.5 hello true

// Fold expression (C++17)
template<typename... Args>
int sum(Args... args) {
    return (args + ... + 0);  // Fold left
}

sum(1, 2, 3, 4);  // Returns 10
```

#### SFINAE (Substitution Failure Is Not An Error)
```cpp
#include <type_traits>

// Enable only for integral types
template<typename T,
         enable_if_t<is_integral_v<T>, int> = 0>
void process(T val) {
    cout << "Integral: " << val << "\n";
}

// Enable only for floating point types
template<typename T,
         enable_if_t<is_floating_point_v<T>, int> = 0>
void process(T val) {
    cout << "Float: " << val << "\n";
}

process(42);    // Integral: 42
process(3.14);  // Float: 3.14
process("hi");  // ERROR: no matching function
```

#### CRTP (Curiously Recurring Template Pattern)
```cpp
// Base class
template<typename Derived>
class Base {
public:
    void call() {
        static_cast<Derived*>(this)->impl();
    }
};

// Derived classes
class Derived1 : public Base<Derived1> {
public:
    void impl() { cout << "Derived1\n"; }
};

class Derived2 : public Base<Derived2> {
public:
    void impl() { cout << "Derived2\n"; }
};

Derived1 d1;
d1.call();  // Calls Derived1::impl without virtual

Derived2 d2;
d2.call();  // Calls Derived2::impl without virtual
```

### Quick Reference Table

| Concept | Usage | Key Benefit |
|---------|-------|------------|
| Function template | Generic function | Type safety, code reuse |
| Class template | Generic class | Containers, utilities |
| Full specialization | Custom version for specific type | Optimization |
| Partial specialization | Custom version for pattern | Flexibility |
| Variadic template | Variable arguments | printf-style APIs |
| SFINAE | Conditional compilation | Overload resolution |
| CRTP | Non-virtual polymorphism | Performance (no vfptr) |
| Concepts (C++20) | Type constraints | Error clarity |

### Problems

#### Easy (All 10)
- [ ] Write a simple max<T> function template
- [ ] Create a Stack<T> class template
- [ ] Template function for swapping two values
- [ ] Template class for Pair<T, U>
- [ ] Print any type using template function
- [ ] Vector-like container template
- [ ] Template specialization for string type
- [ ] Function template with multiple parameters
- [ ] Template with default parameter
- [ ] Template function calling specialization

#### Medium (All 10+)
- [ ] Partial specialization for pointers: Container<T*>
- [ ] Partial specialization for vectors: Container<vector<T>>
- [ ] Variadic template: print function with any types
- [ ] Variadic template: sum function
- [ ] SFINAE with enable_if for integral types
- [ ] SFINAE with is_floating_point
- [ ] Template metaprogramming: compute factorial at compile time
- [ ] CRTP: base class calls derived method
- [ ] Function template with variadic arguments
- [ ] Class template with template member function

#### Hard (All 10)
- [ ] Implement a type_traits-like template
- [ ] Partial specialization for function pointers
- [ ] Variadic template with fold expressions (C++17)
- [ ] Template template parameters
- [ ] Concepts (C++20): require clause
- [ ] Advanced CRTP: static polymorphism
- [ ] Expression templates (manual optimization)
- [ ] Compile-time type computation
- [ ] Variadic template for heterogeneous tuple
- [ ] Meta-function composition

---

## 5. Bit Manipulation

### Key Concepts

#### 6 Bitwise Operators
```cpp
int a = 5;    // 0101
int b = 3;    // 0011

// AND: both bits must be 1
int c = a & b;  // 0001 = 1

// OR: at least one bit is 1
int d = a | b;  // 0111 = 7

// XOR: bits are different
int e = a ^ b;  // 0110 = 6

// NOT: flip all bits
int f = ~a;    // ~0101 = 1010 (in 2's complement, -6)

// Left shift: multiply by 2^n
int g = a << 1;  // 0101 << 1 = 1010 = 10

// Right shift: divide by 2^n (for positive numbers)
int h = a >> 1;  // 0101 >> 1 = 0010 = 2
```

#### Essential Bit Tricks (Memorize)

```cpp
int x = 5;  // 0101

// Check if bit i is set
bool isBitSet = (x & (1 << i)) != 0;  // i=0 → true, i=1 → false

// Set bit i
x |= (1 << i);  // 0101 |= 0001 = 0101 (already set)

// Clear bit i
x &= ~(1 << i);  // 0101 &= 1110 = 0100

// Toggle bit i
x ^= (1 << i);  // 0101 ^= 0001 = 0100

// Check if power of 2
bool isPowerOf2 = (x != 0) && ((x & (x-1)) == 0);  // 5 & 4 = 0101 & 0100 = 0100 (not power of 2)

// Count number of set bits
int count = __builtin_popcount(x);  // 2 for 0101

// Find rightmost set bit
int rightmost = x & (-x);  // 5 & -5 = 0101 & 1011 = 0001 = 1

// Get highest set bit position
int highBit = 31 - __builtin_clz(x);  // For 5: 31 - 29 = 2 (bit at position 2)

// Check if i-th bit is set (0-indexed from right)
bool iBitSet = (x >> i) & 1;

// Clear lowest set bit
x &= x - 1;  // 0101 &= 0100 = 0100
```

#### Brian Kernighan's Trick
```cpp
// Count set bits efficiently
int countSetBits(int n) {
    int count = 0;
    while (n) {
        n &= n - 1;  // Removes one set bit each time
        count++;
    }
    return count;
}
// 5 = 101 → 100 → 000 (count = 2)
```

#### XOR Properties
```cpp
// XOR is commutative and associative
a ^ b = b ^ a
(a ^ b) ^ c = a ^ (b ^ c)

// x ^ x = 0
5 ^ 5 = 0

// x ^ 0 = x
5 ^ 0 = 5

// XOR swaps without temp variable
a = a ^ b;
b = b ^ a;  // b = b ^ (a^b) = a
a = a ^ b;  // a = (a^b) ^ a = b

// Find single number in array where all others appear twice
int single(vector<int>& nums) {
    int result = 0;
    for (int num : nums) result ^= num;
    return result;  // All pairs cancel out
}
```

#### Bitmask Techniques
```cpp
// Use bitmask to represent set
int mask = 0;
int n = 3;

// Add element
mask |= (1 << 1);  // Add element 1

// Check if element exists
bool exists = (mask & (1 << 1)) != 0;

// Remove element
mask &= ~(1 << 1);

// Iterate through all elements in mask
for (int i = 0; i < n; i++) {
    if (mask & (1 << i)) {
        // i-th element exists
    }
}

// Generate all subsets
for (int subset = 0; subset < (1 << n); subset++) {
    // Process subset
    for (int i = 0; i < n; i++) {
        if (subset & (1 << i)) {
            // Include element i
        }
    }
}
```

#### Register/Embedded Manipulation
```cpp
// Typical use: configure hardware registers
struct Register {
    uint32_t data;

    // Get bits [high:low]
    uint32_t getBits(int low, int high) {
        int width = high - low + 1;
        return (data >> low) & ((1 << width) - 1);
    }

    // Set bits [high:low] to value
    void setBits(int low, int high, uint32_t value) {
        int width = high - low + 1;
        uint32_t mask = ((1 << width) - 1) << low;
        data = (data & ~mask) | ((value << low) & mask);
    }
};
```

### Code Templates

```cpp
// Check if n is power of 2
bool isPowerOfTwo(int n) {
    return n > 0 && (n & (n - 1)) == 0;
}

// Count set bits
int popcount(int n) {
    int count = 0;
    while (n) {
        n &= n - 1;
        count++;
    }
    return count;
    // Or: return __builtin_popcount(n);
}

// Get i-th bit
int getBit(int n, int i) {
    return (n >> i) & 1;
}

// Set i-th bit
void setBit(int& n, int i) {
    n |= (1 << i);
}

// Clear i-th bit
void clearBit(int& n, int i) {
    n &= ~(1 << i);
}

// Toggle i-th bit
void toggleBit(int& n, int i) {
    n ^= (1 << i);
}

// Find rightmost set bit position
int rightmostSetBitPos(int n) {
    return __builtin_ctz(n);  // Count trailing zeros
}

// Check if two numbers have opposite signs
bool oppositeSign(int a, int b) {
    return (a ^ b) < 0;
}

// Swap two numbers without temp
void swap(int& a, int& b) {
    a = a ^ b;
    b = b ^ a;
    a = a ^ b;
}
```

### Quick Reference Table

| Operation | Code | Result |
|-----------|------|--------|
| Check bit i | `(n >> i) & 1` | 0 or 1 |
| Set bit i | `n \|= (1 << i)` | bit i = 1 |
| Clear bit i | `n &= ~(1 << i)` | bit i = 0 |
| Toggle bit i | `n ^= (1 << i)` | bit i flipped |
| Check power of 2 | `(n & (n-1)) == 0` | boolean |
| Count set bits | `__builtin_popcount(n)` | int |
| Highest bit pos | `31 - __builtin_clz(n)` | int |
| Lowest set bit | `n & (-n)` | int |
| All bits set in k bits | `(1 << k) - 1` | int |

### Problems

#### Easy (All 10)
- [ ] Check if bit i is set
- [ ] Set bit i
- [ ] Clear bit i
- [ ] Count number of set bits
- [ ] Check if number is power of 2
- [ ] Find rightmost set bit
- [ ] Check if two numbers have opposite signs
- [ ] Swap two numbers using XOR
- [ ] Get the i-th bit
- [ ] Toggle bit i

#### Medium (All 10)
- [ ] Find single number in array (all others appear twice)
- [ ] Find two numbers appearing once (all others twice)
- [ ] Reverse bits of a number
- [ ] Number of 1 bits (various approaches)
- [ ] Missing number using XOR
- [ ] Majority element using bit manipulation
- [ ] Check if number has alternating bits
- [ ] Generate all subsets using bitmask
- [ ] Gray code sequence
- [ ] Single number III (two different single numbers)

#### Hard (All 10)
- [ ] Bitwise AND of range [n, m]
- [ ] Max product of word lengths with no common letters
- [ ] Prime number of set bits
- [ ] Rearrange bits for palindrome
- [ ] Counting bits (1 to n)
- [ ] Hamming distance variations
- [ ] Totemic power (custom bit problems)
- [ ] Bit expression evaluation
- [ ] Find elements appearing once and twice
- [ ] Maximize XOR of two numbers in array

---

## 6. Concurrency Basics (Threading + Sync)

### Key Concepts

#### Thread Creation & Basics
```cpp
#include <thread>
#include <mutex>

void workerFunc() {
    cout << "Running in thread\n";
}

int main() {
    // Create thread
    thread t(workerFunc);

    // Wait for completion
    t.join();  // Must call join() or detach() before destructor

    // Or detach (background thread)
    // t.detach();  // Thread runs independently

    return 0;
}

// Pass arguments
void add(int a, int b) {
    cout << a + b << "\n";
}

thread t(add, 3, 4);  // Prints 7
t.join();
```

#### Lock Guard Preference
```cpp
#include <mutex>

mutex mtx;
int counter = 0;

// BAD: manual lock/unlock (easy to forget unlock)
void incrementBad() {
    mtx.lock();
    counter++;
    mtx.unlock();  // If exception before this, never unlocks!
}

// GOOD: lock_guard (RAII)
void incrementGood() {
    lock_guard<mutex> lock(mtx);  // Acquires lock
    counter++;
}  // lock released automatically when lock_guard destroyed

// ALSO GOOD: unique_lock (more features)
void incrementAlsoGood() {
    unique_lock<mutex> lock(mtx);
    counter++;
}  // lock released automatically

// unique_lock has more control
{
    unique_lock<mutex> lock(mtx);
    // ...
    lock.unlock();  // Manual release
    // ...
    lock.lock();    // Re-acquire
}
```

#### Mutex vs Atomic
```cpp
#include <atomic>

// Mutex: protects entire critical section
mutex mtx;
void criticalSection() {
    lock_guard<mutex> lock(mtx);
    // All code here is protected
    data.modify();
    data.read();
}

// Atomic: operations are atomic (indivisible)
atomic<int> counter(0);
counter++;  // Atomic increment, no mutex needed
int val = counter.load();  // Atomic read
counter.store(5);  // Atomic write

// When to use:
// - Atomic: simple counters, flags
// - Mutex: complex shared structures
```

#### Data Races
```cpp
// DATA RACE: undefined behavior
int x = 0;
// Thread 1: x = x + 1;
// Thread 2: x = x + 1;
// Result: x could be 1 or 2 (or garbage)

// SOLUTION: Use atomic or mutex
atomic<int> x(0);
x++;  // Safe

mutex mtx;
int y = 0;
{
    lock_guard<mutex> lock(mtx);
    y = y + 1;  // Safe
}
```

#### Condition Variable
```cpp
#include <condition_variable>

mutex mtx;
condition_variable cv;
bool ready = false;

void waiter() {
    unique_lock<mutex> lock(mtx);
    cv.wait(lock, [] { return ready; });  // Wait until ready = true
    cout << "Proceeding\n";
}

void notifier() {
    {
        lock_guard<mutex> lock(mtx);
        ready = true;
    }
    cv.notify_one();  // Wake one waiter
    // Or: cv.notify_all();  // Wake all waiters
}
```

#### Deadlock Basics
```cpp
// DEADLOCK: two threads waiting for each other
mutex m1, m2;

void thread1Func() {
    lock_guard<mutex> l1(m1);
    this_thread::sleep_for(chrono::milliseconds(10));
    lock_guard<mutex> l2(m2);  // Waits here
}

void thread2Func() {
    lock_guard<mutex> l2(m2);
    this_thread::sleep_for(chrono::milliseconds(10));
    lock_guard<mutex> l1(m1);  // Waits here — DEADLOCK!
}

// SOLUTION: Always acquire locks in same order
void thread1Fixed() {
    lock_guard<mutex> l1(m1);
    lock_guard<mutex> l2(m2);
    // ...
}

void thread2Fixed() {
    lock_guard<mutex> l1(m1);  // Acquire in same order
    lock_guard<mutex> l2(m2);
    // ...
}
```

### Key Interview Questions

- [ ] Difference between lock_guard and unique_lock
- [ ] Explain condition_variable and its use
- [ ] What is a data race?
- [ ] Mutex vs Atomic: when to use each
- [ ] How does deadlock occur? (4 conditions)
- [ ] What is the Rule of 5 in context of threads?
- [ ] Explain RAII for locks
- [ ] notify_one vs notify_all trade-offs
- [ ] What is spurious wakeup?
- [ ] How to safely join multiple threads?

---

# PHASE 2: ARRAYS & STRING PROBLEM SOLVING

## 7. Strings

### Key Concepts

#### String vs C-string
```cpp
// C-string: array of chars, null-terminated
const char* cstr = "hello";     // Read-only
char cstr2[] = "hello";         // Mutable array

// std::string: C++ string class, safer
string s = "hello";
s += " world";
cout << s;  // "hello world"

// Useful methods
s.length();           // 5
s[0];                 // 'h'
s.substr(0, 2);       // "he"
s.find("ll");         // 2
s.replace(2, 2, "");  // "heo"
```

#### String Manipulation
```cpp
// Split string
vector<string> split(const string& s, char delim) {
    vector<string> result;
    stringstream ss(s);
    string item;
    while (getline(ss, item, delim)) {
        result.push_back(item);
    }
    return result;
}

// Join strings
string join(const vector<string>& v, const string& delim) {
    string result;
    for (int i = 0; i < v.size(); i++) {
        result += v[i];
        if (i < v.size() - 1) result += delim;
    }
    return result;
}

// Trim whitespace
string trim(const string& s) {
    int start = 0, end = s.length() - 1;
    while (start <= end && isspace(s[start])) start++;
    while (end >= start && isspace(s[end])) end--;
    return s.substr(start, end - start + 1);
}

// Convert case
string toLower(string s) {
    for (char& c : s) c = tolower(c);
    return s;
}
```

#### Pattern Matching (KMP)
```cpp
// KMP: find substring in O(n+m)
vector<int> buildLPS(const string& pattern) {
    int m = pattern.length();
    vector<int> lps(m, 0);
    int len = 0, i = 1;
    while (i < m) {
        if (pattern[i] == pattern[len]) {
            lps[i++] = ++len;
        } else if (len > 0) {
            len = lps[len - 1];
        } else {
            lps[i++] = 0;
        }
    }
    return lps;
}

int kmpSearch(const string& text, const string& pattern) {
    vector<int> lps = buildLPS(pattern);
    int n = text.length(), m = pattern.length();
    int i = 0, j = 0;
    while (i < n) {
        if (text[i] == pattern[j]) {
            i++; j++;
        }
        if (j == m) return i - m;  // Found at i-m
        if (i < n && text[i] != pattern[j]) {
            j = (j > 0) ? lps[j - 1] : 0;
        }
    }
    return -1;  // Not found
}
```

### Problems

#### Easy (All 10)
- [ ] Check if string is palindrome
- [ ] Reverse a string
- [ ] First unique character in string
- [ ] Valid anagram
- [ ] Convert string to integer
- [ ] Longest common prefix
- [ ] Valid parentheses in expression
- [ ] Duplicate characters
- [ ] Character frequency count
- [ ] Case conversion (upper/lower)

#### Medium (All 10)
- [ ] Longest substring without repeating characters
- [ ] Substring with all unique characters
- [ ] Longest palindromic substring
- [ ] String compression
- [ ] Decode string (e.g., "2[a]3[bc]")
- [ ] Word break problem
- [ ] Integer to Roman numerals
- [ ] Text justification
- [ ] Wildcard pattern matching
- [ ] Regular expression matching (basic)

#### Hard (All 10)
- [ ] Edit distance (Levenshtein)
- [ ] Longest common subsequence
- [ ] KMP string matching
- [ ] Rabin-Karp algorithm
- [ ] Regular expression matching (full)
- [ ] Autocomplete system (Trie + sorting)
- [ ] Shortest superstring problem
- [ ] Word pattern matching
- [ ] Palindrome partitioning
- [ ] Scramble string

---

## 8. Vectors (Dynamic Arrays)

### Key Concepts

#### Vector Basics
```cpp
#include <vector>

vector<int> v;           // Empty vector
vector<int> v(10);       // 10 elements, default-initialized
vector<int> v(10, 5);    // 10 elements, all 5
vector<int> v = {1,2,3}; // Initializer list

// Methods
v.push_back(4);          // Add to end: {1,2,3,4}
v.pop_back();            // Remove from end: {1,2,3}
v[0];                    // Access element 0
v.at(0);                 // Access with bounds check (throws)
v.size();                // Number of elements
v.capacity();            // Allocated capacity
v.empty();               // Is empty?
v.clear();               // Remove all elements
v.erase(v.begin());      // Erase first element
v.insert(v.begin(), 0);  // Insert at beginning
```

#### Vector Iteration
```cpp
vector<int> v = {1,2,3,4,5};

// Index-based
for (int i = 0; i < v.size(); i++) {
    cout << v[i] << " ";
}

// Iterator
for (auto it = v.begin(); it != v.end(); ++it) {
    cout << *it << " ";
}

// Range-based (C++11)
for (int x : v) {
    cout << x << " ";
}

// Reverse iteration
for (auto it = v.rbegin(); it != v.rend(); ++it) {
    cout << *it << " ";
}
```

#### Vector Performance
```cpp
// push_back: O(1) amortized
v.push_back(x);

// insert/erase at beginning: O(n), expensive!
v.insert(v.begin(), x);    // Shifts all elements
v.erase(v.begin());        // Shifts all elements

// insert/erase at end: O(1)
v.erase(v.end() - 1);  // O(1)

// Random access: O(1)
v[5];  // Direct memory access

// Reserve space to avoid reallocation
v.reserve(1000);  // Allocate space without creating elements
```

#### 2D Vector
```cpp
vector<vector<int>> matrix(rows, vector<int>(cols, 0));

// Access
matrix[0][0] = 5;
matrix[i][j];

// Iterate
for (int i = 0; i < rows; i++) {
    for (int j = 0; j < cols; j++) {
        cout << matrix[i][j];
    }
}

// Dynamic rows
vector<vector<int>> matrix;
for (int i = 0; i < rows; i++) {
    matrix.push_back(vector<int>(cols, 0));
}
```

### Problems

#### Easy (All 10)
- [ ] Remove element from vector
- [ ] Find duplicate in array
- [ ] Missing number in array
- [ ] Majority element
- [ ] Move zeros to end
- [ ] Rotate array
- [ ] Best time to buy/sell stock
- [ ] Longest increasing subsequence length
- [ ] Sum of two elements equals target
- [ ] Sliding window maximum

#### Medium (All 10)
- [ ] Longest consecutive sequence
- [ ] Container with most water
- [ ] Trapping rain water
- [ ] 3Sum
- [ ] Next permutation
- [ ] Median of two sorted arrays
- [ ] Product of array except self
- [ ] Search in rotated array
- [ ] Jump game variations
- [ ] Minimum size subarray sum

#### Hard (All 10)
- [ ] Largest rectangle in histogram
- [ ] Maximal rectangle
- [ ] First missing positive
- [ ] Smallest range
- [ ] Median finder (streaming)
- [ ] Sliding window median
- [ ] Largest number
- [ ] Kth smallest element variations
- [ ] Skyline problem
- [ ] Split array largest sum

---

## 9. Arrays, Hash Maps & Prefix Sums

### Key Concepts

#### Hash Map Basics
```cpp
#include <unordered_map>

unordered_map<string, int> map;

// Insert
map["apple"] = 5;
map.insert({"banana", 3});

// Access
map["apple"];         // 5, creates if not exist
map.at("apple");      // 5, throws if not exist
map.count("apple");   // 1 if exists, 0 if not

// Iterate
for (auto& pair : map) {
    cout << pair.first << " " << pair.second << "\n";
}

// Remove
map.erase("apple");
map.clear();
```

#### Frequency Counting Pattern
```cpp
// Count character frequency
unordered_map<char, int> freq;
for (char c : s) {
    freq[c]++;
}

// Find most frequent
int maxFreq = 0;
char maxChar;
for (auto& p : freq) {
    if (p.second > maxFreq) {
        maxFreq = p.second;
        maxChar = p.first;
    }
}
```

#### Prefix Sum Pattern
```cpp
// Compute prefix sums
vector<int> arr = {1, 2, 3, 4, 5};
vector<int> prefix(arr.size() + 1, 0);
for (int i = 0; i < arr.size(); i++) {
    prefix[i + 1] = prefix[i] + arr[i];
}
// prefix = {0, 1, 3, 6, 10, 15}

// Query range sum [l, r]
int rangeSum = prefix[r + 1] - prefix[l];
// Sum from index l to r

// 2D prefix sum
vector<vector<int>> prefix(rows + 1, vector<int>(cols + 1, 0));
for (int i = 1; i <= rows; i++) {
    for (int j = 1; j <= cols; j++) {
        prefix[i][j] = matrix[i-1][j-1]
                     + prefix[i-1][j]
                     + prefix[i][j-1]
                     - prefix[i-1][j-1];
    }
}

// Range sum query [r1,c1] to [r2,c2]
int rectSum = prefix[r2+1][c2+1] - prefix[r1][c2+1] - prefix[r2+1][c1] + prefix[r1][c1];
```

### Problems

#### Easy (All 10)
- [ ] Two sum
- [ ] Contains duplicate
- [ ] Valid anagram
- [ ] Group anagrams (simple)
- [ ] Majority element using hash
- [ ] Intersection of two arrays
- [ ] Happy number
- [ ] Isomorphic strings
- [ ] Ransom note
- [ ] Word pattern

#### Medium (All 10)
- [ ] Top K frequent elements
- [ ] Least frequent words
- [ ] All anagrams in string
- [ ] Subarrays with K distinct integers
- [ ] Longest substring with K distinct chars
- [ ] Range sum query using prefix sum
- [ ] 2D range sum query
- [ ] Subarray sum equals K
- [ ] Maximum size subarray sum equals K
- [ ] Design hash set/map

#### Hard (All 10)
- [ ] Four sum
- [ ] All anagrams of substring
- [ ] Sliding window maximum with distinct
- [ ] LRU cache implementation
- [ ] LFU cache implementation
- [ ] Sparse vector dot product
- [ ] Group shifted strings
- [ ] Design search autocomplete system
- [ ] First unique character (stream)
- [ ] Randomized set with duplicates

---

## 10. Binary Search Patterns

### Key Concepts

#### Simple Binary Search
```cpp
// Find exact target
int binarySearch(vector<int>& arr, int target) {
    int left = 0, right = arr.size() - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;  // Not found
}
```

#### Lower Bound / Upper Bound
```cpp
// Lower bound: first element >= target
int lowerBound(vector<int>& arr, int target) {
    int left = 0, right = arr.size();
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] < target) left = mid + 1;
        else right = mid;
    }
    return left;
}

// Upper bound: first element > target
int upperBound(vector<int>& arr, int target) {
    int left = 0, right = arr.size();
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] <= target) left = mid + 1;
        else right = mid;
    }
    return left;
}

// Count occurrences of target
int countTarget(vector<int>& arr, int target) {
    int lower = lowerBound(arr, target);
    int upper = upperBound(arr, target);
    if (lower < arr.size() && arr[lower] == target) {
        return upper - lower;
    }
    return 0;
}
```

#### Binary Search on Answer
```cpp
// Minimize K such that predicate(K) is true
// Pattern: answer space is [lo, hi]

// Example: minimum speed to finish journey
int minimumSpeed(vector<int>& dist, int hour) {
    int left = 1, right = 1e7;
    while (left < right) {
        int mid = left + (right - left) / 2;
        // Check if we can finish with speed mid
        long long time = 0;
        for (int d : dist) time += (d + mid - 1) / mid;  // Ceil division

        if (time <= hour) right = mid;  // Can do better
        else left = mid + 1;
    }
    return left;
}
```

#### Search in Rotated Array
```cpp
// Array like [4,5,6,7,0,1,2]
int searchRotated(vector<int>& arr, int target) {
    int left = 0, right = arr.size() - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;

        // Determine which half is sorted
        if (arr[left] <= arr[mid]) {  // Left half sorted
            if (target >= arr[left] && target < arr[mid]) {
                right = mid - 1;  // Target in sorted left half
            } else {
                left = mid + 1;   // Target in right half
            }
        } else {  // Right half sorted
            if (target > arr[mid] && target <= arr[right]) {
                left = mid + 1;   // Target in sorted right half
            } else {
                right = mid - 1;  // Target in left half
            }
        }
    }
    return -1;
}
```

### Problems

#### Easy (All 10)
- [ ] Binary search on sorted array
- [ ] Search in rotated array (no duplicates)
- [ ] First bad version (binary search on answer)
- [ ] Guess number (higher/lower)
- [ ] Peak element
- [ ] Sqrt(x) integer part
- [ ] Pow(x, n)
- [ ] Search position for insertion
- [ ] Valid perfect square
- [ ] Arranging coins

#### Medium (All 10)
- [ ] Search in rotated array with duplicates
- [ ] Find in mountain array
- [ ] Search in 2D matrix
- [ ] Kth smallest element in BST
- [ ] Time based key-value store
- [ ] Minimum speed to finish journey
- [ ] Capacity to ship packages within D days
- [ ] Divide chocolate
- [ ] Find the smallest divisor
- [ ] Maximum average pass ratio

#### Hard (All 10)
- [ ] Median of two sorted arrays
- [ ] Ugly number III
- [ ] Minimum incompatibility
- [ ] Painter's partition problem
- [ ] Allocate mailboxes
- [ ] Smallest divisor with threshold
- [ ] Count negative numbers in sorted matrix
- [ ] Maximum profit with K transactions
- [ ] Random point in non-overlapping rectangles
- [ ] Largest rectangle in histogram (using binary search)

---

# PHASE 3: LINEAR DATA STRUCTURES

## 11. Linked Lists

### Key Concepts

#### Linked List Node
```cpp
struct ListNode {
    int val;
    ListNode* next;
    ListNode(int x) : val(x), next(nullptr) {}
};
```

#### Basic Operations
```cpp
// Create list: 1 -> 2 -> 3
ListNode* head = new ListNode(1);
head->next = new ListNode(2);
head->next->next = new ListNode(3);

// Traverse
for (ListNode* p = head; p; p = p->next) {
    cout << p->val << " ";
}

// Insert at beginning
ListNode* newHead = new ListNode(0);
newHead->next = head;
head = newHead;

// Insert at specific position
void insertAfter(ListNode* prev, int val) {
    ListNode* newNode = new ListNode(val);
    newNode->next = prev->next;
    prev->next = newNode;
}

// Delete a node (given node pointer)
void deleteNode(ListNode* node) {
    node->val = node->next->val;
    node->next = node->next->next;
}

// Delete entire list
void deleteList(ListNode* head) {
    while (head) {
        ListNode* temp = head;
        head = head->next;
        delete temp;
    }
}
```

#### Dummy Node Pattern
```cpp
// Dummy node simplifies edge cases (no special case for head)
ListNode* dummy = new ListNode(0);
dummy->next = head;
ListNode* curr = dummy;

// Insert nodes...
// At end, actual head is dummy->next
head = dummy->next;
delete dummy;
```

#### Slow-Fast Pointer (Floyd)
```cpp
// Find middle
ListNode* slowFast(ListNode* head) {
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
    }
    return slow;  // Points to middle
}

// Detect cycle
ListNode* detectCycle(ListNode* head) {
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) {
            // Cycle found, find entry point
            ListNode* ptr = head;
            while (ptr != slow) {
                ptr = ptr->next;
                slow = slow->next;
            }
            return ptr;  // Cycle start
        }
    }
    return nullptr;  // No cycle
}
```

#### Reverse Linked List
```cpp
// Iterative
ListNode* reverse(ListNode* head) {
    ListNode* prev = nullptr, *curr = head;
    while (curr) {
        ListNode* next = curr->next;
        curr->next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
}

// Recursive
ListNode* reverseRecursive(ListNode* head) {
    if (!head || !head->next) return head;
    ListNode* newHead = reverseRecursive(head->next);
    head->next->next = head;
    head->next = nullptr;
    return newHead;
}
```

### Problems

#### Easy (All 10)
- [ ] Reverse linked list
- [ ] Merge two sorted lists
- [ ] Remove duplicates from sorted list
- [ ] Delete node in linked list
- [ ] Palindrome linked list
- [ ] Intersection of two linked lists
- [ ] Linked list cycle detection
- [ ] Find kth node from end
- [ ] Middle of linked list
- [ ] Rotate list right by K

#### Medium (All 10)
- [ ] Add two numbers (reverse order)
- [ ] Odd even linked list
- [ ] Remove nth node from end
- [ ] Reorder list
- [ ] Partition list
- [ ] Copy list with random pointer
- [ ] Sort list (merge sort)
- [ ] Reverse nodes in k-group
- [ ] Merge k sorted lists
- [ ] Design LRU cache (DLL + HashMap)

#### Hard (All 10)
- [ ] Reverse nodes in k-group (variations)
- [ ] Add two numbers (forward order)
- [ ] Merge k sorted lists (optimal)
- [ ] LRU cache (complete implementation)
- [ ] Flatten multi-level linked list
- [ ] Merge sorted linked list variations
- [ ] Palindrome II (two pointers)
- [ ] Linked list cycle II (find entry)
- [ ] Split linked list in parts
- [ ] Insert delete getRandom O(1)

---

## 12. Stacks

### Key Concepts

#### Stack Basics
```cpp
#include <stack>

stack<int> st;

// Push
st.push(1);
st.push(2);
st.push(3);

// Access top
st.top();      // 3

// Pop
st.pop();      // Stack now {1, 2}

// Queries
st.empty();    // false
st.size();     // 2
```

#### Use Cases: Parentheses
```cpp
bool isValid(string s) {
    stack<char> st;
    unordered_map<char, char> close = {{')', '('}, {']', '['}, {'}', '{'}};
    for (char c : s) {
        if (close.count(c)) {  // Closing bracket
            if (st.empty() || st.top() != close[c]) return false;
            st.pop();
        } else {  // Opening bracket
            st.push(c);
        }
    }
    return st.empty();
}
```

#### Monotonic Stack
```cpp
// Next greater element
vector<int> nextGreaterElement(vector<int>& arr) {
    int n = arr.size();
    vector<int> result(n, -1);
    stack<int> st;  // Stores indices in decreasing order of values

    for (int i = n - 1; i >= 0; i--) {
        while (!st.empty() && arr[st.top()] <= arr[i]) {
            st.pop();  // Pop smaller elements
        }
        if (!st.empty()) result[i] = arr[st.top()];
        st.push(i);
    }
    return result;
}

// Largest rectangle in histogram
int largestRectangle(vector<int>& heights) {
    int n = heights.size(), maxArea = 0;
    stack<int> st;  // Indices in increasing height order

    for (int i = 0; i < n; i++) {
        while (!st.empty() && heights[st.top()] > heights[i]) {
            int h = heights[st.top()]; st.pop();
            int w = st.empty() ? i : i - st.top() - 1;
            maxArea = max(maxArea, h * w);
        }
        st.push(i);
    }
    while (!st.empty()) {
        int h = heights[st.top()]; st.pop();
        int w = st.empty() ? n : n - st.top() - 1;
        maxArea = max(maxArea, h * w);
    }
    return maxArea;
}
```

### Problems

#### Easy (All 10)
- [ ] Valid parentheses
- [ ] Balanced parentheses variations
- [ ] Implement stack using array/vector
- [ ] Min stack (track minimum)
- [ ] Next greater element (simple)
- [ ] Reverse string using stack
- [ ] Backspace string comparison
- [ ] Baseball game
- [ ] Simplify path
- [ ] Evaluate RPN

#### Medium (All 10)
- [ ] Largest rectangle in histogram
- [ ] Maximal rectangle
- [ ] Trapping rain water
- [ ] Daily temperatures
- [ ] Simplify path (filesystem)
- [ ] Decode string
- [ ] Remove k digits
- [ ] Removing stars from string
- [ ] Evaluate reverse Polish notation
- [ ] Exclusive time of functions

#### Hard (All 10)
- [ ] Largest rectangle in histogram (variations)
- [ ] Maximal rectangle (DP + stack)
- [ ] Trapping rain water II (3D)
- [ ] Remove k digits (greedy)
- [ ] Count visible people
- [ ] Minimum cost to hire K workers
- [ ] Create sorted array through instructions
- [ ] Hardest worker to load
- [ ] Sum of subarray minimums
- [ ] Online stock span

---

## 13. Queues

### Key Concepts

#### Queue Basics
```cpp
#include <queue>

queue<int> q;

// Enqueue
q.push(1);
q.push(2);
q.push(3);

// Access front
q.front();     // 1

// Dequeue
q.pop();       // Queue now {2, 3}

// Queries
q.empty();     // false
q.size();      // 2
```

#### Deque (Double-ended Queue)
```cpp
#include <deque>

deque<int> dq;

// Can add/remove from both ends
dq.push_front(1);   // {1}
dq.push_back(2);    // {1, 2}
dq.pop_front();     // {2}
dq.pop_back();      // {}

// Random access like vector
dq[0];
dq.at(0);
```

#### BFS Template
```cpp
// Standard BFS
queue<pair<int,int>> q;  // Position in grid
vector<vector<int>> visited(rows, vector<int>(cols, 0));

q.push({0, 0});
visited[0][0] = 1;

int dx[] = {0, 0, 1, -1};
int dy[] = {1, -1, 0, 0};

while (!q.empty()) {
    auto [x, y] = q.front();
    q.pop();

    for (int i = 0; i < 4; i++) {
        int nx = x + dx[i];
        int ny = y + dy[i];
        if (nx >= 0 && nx < rows && ny >= 0 && ny < cols && !visited[nx][ny]) {
            visited[nx][ny] = 1;
            q.push({nx, ny});
        }
    }
}
```

#### Sliding Window Maximum (Deque)
```cpp
vector<int> maxSlidingWindow(vector<int>& nums, int k) {
    deque<int> dq;  // Stores indices in decreasing order of values
    vector<int> result;

    for (int i = 0; i < nums.size(); i++) {
        // Remove elements outside current window
        if (!dq.empty() && dq.front() < i - k + 1) {
            dq.pop_front();
        }

        // Remove smaller elements from back
        while (!dq.empty() && nums[dq.back()] < nums[i]) {
            dq.pop_back();
        }

        dq.push_back(i);

        // Add to result once window is full
        if (i >= k - 1) {
            result.push_back(nums[dq.front()]);
        }
    }
    return result;
}
```

### Problems

#### Easy (All 10)
- [ ] Implement queue using stacks
- [ ] Number of islands (BFS)
- [ ] Rotting oranges (BFS)
- [ ] Shortest path in binary matrix
- [ ] As far from land as possible
- [ ] Average of levels in binary tree
- [ ] Binary tree right side view
- [ ] Sliding window maximum (simple)
- [ ] First unique character in stream
- [ ] Implement circular queue

#### Medium (All 10)
- [ ] Sliding window maximum
- [ ] Minimum window substring
- [ ] All nodes at distance K
- [ ] Walls and gates
- [ ] Nearest exit from entrance
- [ ] Level order traversal variations
- [ ] Snakes and ladders (shortest path)
- [ ] Word ladder
- [ ] Shortest path in weighted graph
- [ ] Shortest distance after road addition

#### Hard (All 10)
- [ ] Sliding window maximum (hard variations)
- [ ] Minimum window substring (hard)
- [ ] Word ladder II (all paths)
- [ ] Minimum cost to reach destination
- [ ] Shortest path visiting all nodes
- [ ] Minimum effort path
- [ ] Jump game IV
- [ ] Reachable nodes in subdivided graph
- [ ] Swim in rising water
- [ ] Distribute coins in binary tree

---

# PHASE 4: NON-LINEAR DS + GRAPH THINKING

## 14. Heaps (Priority Queue)

### Key Concepts

#### Heap Basics
```cpp
#include <queue>

// Max heap (default in C++)
priority_queue<int> maxHeap;
maxHeap.push(5);
maxHeap.push(10);
maxHeap.push(3);

maxHeap.top();   // 10
maxHeap.pop();   // Removes 10

// Min heap
priority_queue<int, vector<int>, greater<int>> minHeap;
minHeap.push(5);
minHeap.push(10);
minHeap.push(3);

minHeap.top();   // 3

// Custom comparator
auto cmp = [](pair<int,int> a, pair<int,int> b) {
    return a.second > b.second;  // Min heap by second element
};
priority_queue<pair<int,int>, vector<pair<int,int>>, decltype(cmp)> pq(cmp);
```

#### Heapify
```cpp
// Build heap in O(n)
vector<int> arr = {3, 1, 4, 1, 5, 9, 2, 6};
make_heap(arr.begin(), arr.end());  // Max heap

// Operations
push_heap(arr, arr + arr.size());   // After push_back
pop_heap(arr, arr + arr.size());    // Before pop_back
sort_heap(arr.begin(), arr.end());  // Sorts and destroys heap
```

#### Kth Largest Element
```cpp
int findKthLargest(vector<int>& nums, int k) {
    priority_queue<int, vector<int>, greater<int>> minHeap;  // Min heap of size k

    for (int num : nums) {
        minHeap.push(num);
        if (minHeap.size() > k) {
            minHeap.pop();  // Keep only k elements
        }
    }
    return minHeap.top();  // kth largest
}

// Time: O(n log k)
// Space: O(k)
```

#### Median from Data Stream
```cpp
class MedianFinder {
    priority_queue<int> maxHeap;                                // Left half
    priority_queue<int, vector<int>, greater<int>> minHeap;    // Right half

public:
    void addNum(int num) {
        // Add to appropriate heap
        if (maxHeap.empty() || num <= maxHeap.top()) {
            maxHeap.push(num);
        } else {
            minHeap.push(num);
        }

        // Balance: left should have equal or 1 more
        if (maxHeap.size() > minHeap.size() + 1) {
            minHeap.push(maxHeap.top());
            maxHeap.pop();
        } else if (minHeap.size() > maxHeap.size()) {
            maxHeap.push(minHeap.top());
            minHeap.pop();
        }
    }

    double findMedian() {
        if (maxHeap.size() > minHeap.size()) {
            return maxHeap.top();
        }
        return (maxHeap.top() + minHeap.top()) / 2.0;
    }
};
```

### Problems

#### Easy (All 10)
- [ ] Kth largest element
- [ ] Last stone weight
- [ ] Min heap implementation
- [ ] Heap sort
- [ ] Top K frequent elements (heap)
- [ ] Find K closest elements
- [ ] Relative ranks
- [ ] Decrease key operation
- [ ] K closest points to origin
- [ ] Find Kth smallest element

#### Medium (All 10)
- [ ] Median from data stream
- [ ] Rearrange string k distance apart
- [ ] IPO (maximize capital)
- [ ] Minimum cost to connect ropes
- [ ] Reorganize string
- [ ] Maximum performance of team
- [ ] Minimum stone to get all rewards
- [ ] Smallest range covering elements from k lists
- [ ] Find the kth largest integer in array
- [ ] Design file system with search

#### Hard (All 10)
- [ ] Tricky heaps (custom comparators)
- [ ] Sliding window median
- [ ] Multithreaded K-ary heaps
- [ ] Connect n ropes (optimal)
- [ ] Maximum profit from trading stocks
- [ ] Heap sort optimization
- [ ] Design priority task scheduler
- [ ] Minimum Kobi distance
- [ ] Maximum average pass ratio
- [ ] Distant barcodes

---

## 15. Trees & Binary Trees

### Key Concepts

#### Tree Node
```cpp
struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};
```

#### Traversal Patterns
```cpp
// DFS: Preorder (Root-Left-Right)
void preorder(TreeNode* root) {
    if (!root) return;
    cout << root->val << " ";
    preorder(root->left);
    preorder(root->right);
}

// DFS: Inorder (Left-Root-Right) — sorted for BST
void inorder(TreeNode* root) {
    if (!root) return;
    inorder(root->left);
    cout << root->val << " ";
    inorder(root->right);
}

// DFS: Postorder (Left-Right-Root)
void postorder(TreeNode* root) {
    if (!root) return;
    postorder(root->left);
    postorder(root->right);
    cout << root->val << " ";
}

// BFS: Level order
void levelOrder(TreeNode* root) {
    if (!root) return;
    queue<TreeNode*> q;
    q.push(root);
    while (!q.empty()) {
        TreeNode* node = q.front();
        q.pop();
        cout << node->val << " ";
        if (node->left) q.push(node->left);
        if (node->right) q.push(node->right);
    }
}
```

#### Binary Search Tree (BST)
```cpp
// Search
TreeNode* search(TreeNode* root, int val) {
    if (!root) return nullptr;
    if (root->val == val) return root;
    else if (root->val > val) return search(root->left, val);
    else return search(root->right, val);
}

// Insert
TreeNode* insert(TreeNode* root, int val) {
    if (!root) return new TreeNode(val);
    if (val < root->val) root->left = insert(root->left, val);
    else root->right = insert(root->right, val);
    return root;
}

// Delete
TreeNode* deleteNode(TreeNode* root, int val) {
    if (!root) return nullptr;
    if (val < root->val) {
        root->left = deleteNode(root->left, val);
    } else if (val > root->val) {
        root->right = deleteNode(root->right, val);
    } else {
        // Node to delete found
        if (!root->left) return root->right;
        if (!root->right) return root->left;
        // Two children: find inorder successor
        TreeNode* minRight = root->right;
        while (minRight->left) minRight = minRight->left;
        root->val = minRight->val;
        root->right = deleteNode(root->right, minRight->val);
    }
    return root;
}

// Validate BST
bool isValidBST(TreeNode* root, TreeNode* minNode = nullptr, TreeNode* maxNode = nullptr) {
    if (!root) return true;
    if (minNode && root->val <= minNode->val) return false;
    if (maxNode && root->val >= maxNode->val) return false;
    return isValidBST(root->left, minNode, root) &&
           isValidBST(root->right, root, maxNode);
}
```

#### Lowest Common Ancestor (LCA)
```cpp
TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {
    if (!root) return nullptr;
    if (root == p || root == q) return root;

    TreeNode* left = lowestCommonAncestor(root->left, p, q);
    TreeNode* right = lowestCommonAncestor(root->right, p, q);

    if (left && right) return root;  // p and q on different sides
    return left ? left : right;      // Both on same side
}

// For BST (more efficient)
TreeNode* lcaBST(TreeNode* root, TreeNode* p, TreeNode* q) {
    if (root->val > p->val && root->val > q->val) {
        return lcaBST(root->left, p, q);
    } else if (root->val < p->val && root->val < q->val) {
        return lcaBST(root->right, p, q);
    } else {
        return root;  // Paths diverge here
    }
}
```

#### Serialization/Deserialization
```cpp
class Codec {
public:
    // Encodes tree to single string
    string serialize(TreeNode* root) {
        string result;
        serializeHelper(root, result);
        return result;
    }

    TreeNode* deserialize(string data) {
        istringstream iss(data);
        return deserializeHelper(iss);
    }

private:
    void serializeHelper(TreeNode* root, string& result) {
        if (!root) {
            result += "# ";
            return;
        }
        result += to_string(root->val) + " ";
        serializeHelper(root->left, result);
        serializeHelper(root->right, result);
    }

    TreeNode* deserializeHelper(istringstream& iss) {
        string val;
        iss >> val;
        if (val == "#") return nullptr;
        TreeNode* root = new TreeNode(stoi(val));
        root->left = deserializeHelper(iss);
        root->right = deserializeHelper(iss);
        return root;
    }
};
```

### Problems

#### Easy (All 10)
- [ ] Maximum depth of tree
- [ ] Minimum depth of tree
- [ ] Balanced binary tree
- [ ] Path sum
- [ ] Invert binary tree
- [ ] Same tree
- [ ] Symmetric tree
- [ ] Binary tree level order traversal
- [ ] Binary tree right side view
- [ ] Validate BST (simple)

#### Medium (All 10)
- [ ] Path sum II (all paths)
- [ ] Binary tree zigzag level order
- [ ] Lowest common ancestor
- [ ] Binary search tree iterator
- [ ] Validate BST (complete)
- [ ] Serialize deserialize tree
- [ ] Vertical order traversal
- [ ] All nodes distance K
- [ ] Count nodes in complete tree
- [ ] Most frequent subtree sum

#### Hard (All 10)
- [ ] Binary tree maximum path sum
- [ ] Serialize deserialize (variations)
- [ ] Lowest common ancestor (all variations)
- [ ] Recover binary search tree
- [ ] Binary tree from preorder and inorder
- [ ] Construct binary tree from postorder
- [ ] Maximum binary tree
- [ ] Boundary of binary tree
- [ ] Binary tree cameras
- [ ] Binary tree coloring game

---

## 16. Graphs (BFS, DFS, Topological Sort)

### Key Concepts

#### Graph Representations
```cpp
// Adjacency list
unordered_map<int, vector<int>> graph;
graph[1] = {2, 3};
graph[2] = {1, 4};

// Adjacency matrix
vector<vector<int>> adj(n, vector<int>(n, 0));
adj[1][2] = 1;  // Edge from 1 to 2
```

#### DFS
```cpp
// Recursive DFS
void dfs(int node, unordered_map<int, vector<int>>& graph, unordered_set<int>& visited) {
    visited.insert(node);
    cout << node << " ";
    for (int neighbor : graph[node]) {
        if (visited.find(neighbor) == visited.end()) {
            dfs(neighbor, graph, visited);
        }
    }
}

// Iterative DFS
void dfIterative(int start, unordered_map<int, vector<int>>& graph) {
    stack<int> st;
    unordered_set<int> visited;
    st.push(start);

    while (!st.empty()) {
        int node = st.top();
        st.pop();
        if (visited.count(node)) continue;
        visited.insert(node);
        cout << node << " ";

        for (int neighbor : graph[node]) {
            if (!visited.count(neighbor)) {
                st.push(neighbor);
            }
        }
    }
}
```

#### BFS
```cpp
void bfs(int start, unordered_map<int, vector<int>>& graph) {
    queue<int> q;
    unordered_set<int> visited;
    q.push(start);
    visited.insert(start);

    while (!q.empty()) {
        int node = q.front();
        q.pop();
        cout << node << " ";

        for (int neighbor : graph[node]) {
            if (!visited.count(neighbor)) {
                visited.insert(neighbor);
                q.push(neighbor);
            }
        }
    }
}
```

#### Topological Sort (Kahn's Algorithm)
```cpp
vector<int> topologicalSort(int n, vector<pair<int,int>>& edges) {
    vector<vector<int>> graph(n);
    vector<int> indegree(n, 0);

    for (auto [u, v] : edges) {
        graph[u].push_back(v);
        indegree[v]++;
    }

    queue<int> q;
    for (int i = 0; i < n; i++) {
        if (indegree[i] == 0) q.push(i);
    }

    vector<int> result;
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        result.push_back(u);

        for (int v : graph[u]) {
            indegree[v]--;
            if (indegree[v] == 0) q.push(v);
        }
    }

    if (result.size() != n) return {};  // Cycle detected
    return result;
}
```

#### Dijkstra's Algorithm
```cpp
vector<int> dijkstra(int n, vector<vector<pair<int,int>>>& graph, int start) {
    vector<int> dist(n, INT_MAX);
    priority_queue<pair<int,int>, vector<pair<int,int>>, greater<pair<int,int>>> pq;

    dist[start] = 0;
    pq.push({0, start});

    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();

        if (d > dist[u]) continue;

        for (auto [v, w] : graph[u]) {
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }

    return dist;
}
```

#### Union-Find (Disjoint Set Union)
```cpp
class DSU {
    vector<int> parent, rank;
public:
    DSU(int n) : parent(n), rank(n, 0) {
        iota(parent.begin(), parent.end(), 0);
    }

    int find(int x) {
        if (parent[x] != x) {
            parent[x] = find(parent[x]);  // Path compression
        }
        return parent[x];
    }

    bool unite(int x, int y) {
        x = find(x);
        y = find(y);
        if (x == y) return false;

        if (rank[x] < rank[y]) swap(x, y);
        parent[y] = x;
        if (rank[x] == rank[y]) rank[x]++;
        return true;
    }
};
```

### Problems

#### Easy (All 10)
- [ ] Number of connected components
- [ ] Valid graph (DAG check)
- [ ] Clone graph
- [ ] DFS traversal
- [ ] BFS traversal
- [ ] Find if path exists
- [ ] Shortest path in unweighted graph
- [ ] Number of islands
- [ ] All paths from source to target
- [ ] Bipartite graph

#### Medium (All 10)
- [ ] Course schedule (cycle detection)
- [ ] Course schedule II (topological sort)
- [ ] Alien dictionary (topological sort)
- [ ] Dijkstra shortest path
- [ ] Word ladder (BFS shortest)
- [ ] All paths with given sum
- [ ] Strongly connected components
- [ ] Bridges in graph
- [ ] Critical connections
- [ ] Network time delay

#### Hard (All 10)
- [ ] Word ladder II (all shortest paths)
- [ ] Shortest path with obstacles
- [ ] Minimum cost to make at least one valid path
- [ ] Minimum height trees
- [ ] Reconstruct itinerary
- [ ] Russian doll envelopes (with topological)
- [ ] Maximum path cost with k edges
- [ ] Shortest path in weighted graph with obstacles
- [ ] All connectivity (Floyd-Warshall)
- [ ] Maximum XOR of two numbers in array (with graph)

---

# PHASE 5: RECURSION + ADVANCED PATTERNS

## 17. Recursion Basics

### Key Concepts

#### Recursion Template
```cpp
// Base case: when to stop
// Recursive case: break problem into smaller pieces

int factorial(int n) {
    if (n <= 1) return 1;  // Base case
    return n * factorial(n - 1);  // Recursive case
}

// Tree recursion: multiple recursive calls
int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);  // Exponential without memoization
}
```

#### Backtracking Pattern
```cpp
// Backtracking: explore all possibilities, undo choices
void backtrack(vector<int>& current, vector<vector<int>>& result, ...) {
    // Base case: found a solution
    if (isComplete(current)) {
        result.push_back(current);
        return;
    }

    // Try each choice
    for (each choice) {
        // Make choice
        current.push_back(choice);
        // Recurse
        backtrack(current, result, ...);
        // Undo choice (backtrack)
        current.pop_back();
    }
}
```

#### Memoization (Top-Down DP)
```cpp
unordered_map<int, int> memo;

int fib(int n) {
    if (n <= 1) return n;
    if (memo.count(n)) return memo[n];
    return memo[n] = fib(n - 1) + fib(n - 2);  // O(n)
}
```

### Problems

#### Easy (All 10)
- [ ] Factorial
- [ ] Fibonacci
- [ ] Power(x, n)
- [ ] Reverse string
- [ ] Palindrome check
- [ ] Sum of array
- [ ] Count digits
- [ ] Maximum element in array
- [ ] Binary search recursively
- [ ] Tree height

#### Medium (All 10)
- [ ] Generate all subsets
- [ ] Generate all permutations
- [ ] Combination sum
- [ ] N-queens
- [ ] Wildcard matching
- [ ] Regular expression matching (basic)
- [ ] Word search II
- [ ] Largest rectangle in histogram (recursive)
- [ ] Decode ways
- [ ] Unique paths (with obstacles)

#### Hard (All 10)
- [ ] Sudoku solver
- [ ] N-queens (hard variations)
- [ ] Word break II (all solutions)
- [ ] Palindrome partitioning II
- [ ] Remove invalid parentheses
- [ ] Expression add operators
- [ ] Restore IP addresses
- [ ] Binary tree maximum path sum (recursive)
- [ ] Serialize deserialize (with recursion)
- [ ] Count of smaller numbers after self

---

## 18. Dynamic Programming Basics

### Key Concepts

#### DP Pattern
```cpp
// 1. Identify subproblems
// 2. Define state: dp[i] = answer to subproblem i
// 3. Recurrence: dp[i] = function of previous states
// 4. Base case: dp[0] or dp[1]
// 5. Build up: iterate from base to target

// Example: Coin change
int coinChange(vector<int>& coins, int amount) {
    vector<int> dp(amount + 1, INT_MAX);
    dp[0] = 0;  // Base case: 0 coins for amount 0

    for (int i = 1; i <= amount; i++) {
        for (int coin : coins) {
            if (coin <= i && dp[i - coin] != INT_MAX) {
                dp[i] = min(dp[i], dp[i - coin] + 1);
            }
        }
    }
    return dp[amount] == INT_MAX ? -1 : dp[amount];
}
```

#### 1D DP Array
```cpp
// House robber: max money robbing houses with constraint
int rob(vector<int>& nums) {
    if (nums.empty()) return 0;
    vector<int> dp = nums;
    if (nums.size() > 1) {
        dp[1] = max(nums[0], nums[1]);
    }
    for (int i = 2; i < nums.size(); i++) {
        dp[i] = max(dp[i-1], nums[i] + dp[i-2]);
    }
    return dp.back();
}

// Space optimization: only need last 2 values
int robOptimized(vector<int>& nums) {
    int prev = 0, curr = 0;
    for (int num : nums) {
        int temp = max(curr, prev + num);
        prev = curr;
        curr = temp;
    }
    return curr;
}
```

#### 2D DP Array
```cpp
// Longest common subsequence
int longestCommonSubsequence(string text1, string text2) {
    int m = text1.length(), n = text2.length();
    vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));

    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (text1[i-1] == text2[j-1]) {
                dp[i][j] = dp[i-1][j-1] + 1;
            } else {
                dp[i][j] = max(dp[i-1][j], dp[i][j-1]);
            }
        }
    }
    return dp[m][n];
}
```

#### DP on Trees
```cpp
// Tree DP: compute for each subtree
// dp[node] = answer for subtree rooted at node

int dfs(TreeNode* root, vector<int>& dp) {
    if (!root) return 0;

    // Compute for children
    int leftVal = dfs(root->left, dp);
    int rightVal = dfs(root->right, dp);

    // Combine
    dp[root] = root->val + max(leftVal, rightVal);
    return dp[root];
}
```

### Problems

#### Easy (All 10)
- [ ] Climbing stairs
- [ ] House robber (simple)
- [ ] Min cost climbing stairs
- [ ] Best time to buy and sell stock
- [ ] Longest increasing subsequence length
- [ ] Unique paths in grid
- [ ] Maximum subarray (Kadane)
- [ ] Pascal's triangle
- [ ] Number of dice rolls
- [ ] Decode ways (simple)

#### Medium (All 10)
- [ ] Coin change
- [ ] Longest increasing subsequence
- [ ] Edit distance
- [ ] Unique paths with obstacles
- [ ] Word break
- [ ] Longest palindromic subsequence
- [ ] Partition equal subset sum
- [ ] Maximum product subarray
- [ ] 0/1 Knapsack
- [ ] Buy and sell stock with cooldown

#### Hard (All 10)
- [ ] Minimum path sum (complex)
- [ ] Maximal rectangle
- [ ] Burst balloons
- [ ] Regular expression matching
- [ ] Distinct subsequences
- [ ] Palindrome partitioning II
- [ ] Buy and sell stock IV
- [ ] Shortest path in grid with obstacles
- [ ] Interleaving string
- [ ] Russian doll envelopes

---

## 19. Backtracking

### Key Concepts

#### Subsets Generation
```cpp
// Generate all subsets
vector<vector<int>> subsets(vector<int>& nums) {
    vector<vector<int>> result;
    vector<int> current;
    backtrack(nums, 0, current, result);
    return result;
}

void backtrack(vector<int>& nums, int start, vector<int>& current, vector<vector<int>>& result) {
    result.push_back(current);  // Add current subset

    for (int i = start; i < nums.size(); i++) {
        current.push_back(nums[i]);
        backtrack(nums, i + 1, current, result);  // Recurse
        current.pop_back();  // Backtrack
    }
}
```

#### Permutations
```cpp
vector<vector<int>> permute(vector<int>& nums) {
    vector<vector<int>> result;
    vector<int> current;
    vector<bool> used(nums.size(), false);
    backtrack(nums, current, used, result);
    return result;
}

void backtrack(vector<int>& nums, vector<int>& current, vector<bool>& used, vector<vector<int>>& result) {
    if (current.size() == nums.size()) {
        result.push_back(current);
        return;
    }

    for (int i = 0; i < nums.size(); i++) {
        if (!used[i]) {
            used[i] = true;
            current.push_back(nums[i]);
            backtrack(nums, current, used, result);
            current.pop_back();
            used[i] = false;
        }
    }
}
```

#### N-Queens
```cpp
vector<vector<string>> solveNQueens(int n) {
    vector<vector<string>> result;
    vector<string> board(n, string(n, '.'));
    backtrack(board, 0, result, n);
    return result;
}

void backtrack(vector<string>& board, int row, vector<vector<string>>& result, int n) {
    if (row == n) {
        result.push_back(board);
        return;
    }

    for (int col = 0; col < n; col++) {
        if (isSafe(board, row, col, n)) {
            board[row][col] = 'Q';
            backtrack(board, row + 1, result, n);
            board[row][col] = '.';
        }
    }
}

bool isSafe(vector<string>& board, int row, int col, int n) {
    // Check column
    for (int i = 0; i < row; i++) {
        if (board[i][col] == 'Q') return false;
    }
    // Check diagonal up-left
    for (int i = row, j = col; i >= 0 && j >= 0; i--, j--) {
        if (board[i][j] == 'Q') return false;
    }
    // Check diagonal up-right
    for (int i = row, j = col; i >= 0 && j < n; i--, j++) {
        if (board[i][j] == 'Q') return false;
    }
    return true;
}
```

### Problems

#### Easy (All 10)
- [ ] Generate subsets
- [ ] Generate subsets II (with duplicates)
- [ ] Generate permutations
- [ ] Generate permutations II (with duplicates)
- [ ] Combine numbers
- [ ] Combination sum
- [ ] Palindrome partitioning
- [ ] Letter combinations of phone
- [ ] Generate parentheses
- [ ] Word search

#### Medium (All 10)
- [ ] N-Queens
- [ ] N-Queens II (count)
- [ ] Sodoku solver
- [ ] Word search II (Trie + backtracking)
- [ ] Combination sum with constraint
- [ ] Partition to K equal sum subsets
- [ ] Restore IP addresses
- [ ] Factor combinations
- [ ] Remove invalid parentheses
- [ ] Stickers to spell word

#### Hard (All 10)
- [ ] Expression add operators
- [ ] Word search II (hard)
- [ ] Palindrome partitioning II
- [ ] N-Queens variations
- [ ] Regex matching with backtracking
- [ ] Longest increasing subsequence (with backtracking)
- [ ] Count of different ways to build houses
- [ ] Beautiful arrangement
- [ ] Smallest sequence (with backtracking)
- [ ] Count ways to jump

---

# PHASE 6: GREEDY + OPTIMIZATION

## 20. Greedy Algorithms

### Key Concepts

#### When to Use Greedy
```cpp
// Greedy: make locally optimal choice at each step
// Works if local optimum = global optimum (provable!)

// Example: activity selection / interval scheduling
struct Activity {
    int start, end;
    bool operator<(const Activity& other) const {
        return end < other.end;  // Sort by end time
    }
};

int maxActivities(vector<Activity>& activities) {
    sort(activities.begin(), activities.end());
    int count = 1, lastEnd = activities[0].end;

    for (int i = 1; i < activities.size(); i++) {
        if (activities[i].start >= lastEnd) {  // No overlap
            count++;
            lastEnd = activities[i].end;
        }
    }
    return count;
}
```

#### Jump Game
```cpp
// Can reach last index?
bool canJump(vector<int>& nums) {
    int maxReach = 0;
    for (int i = 0; i < nums.size(); i++) {
        if (i > maxReach) return false;  // Can't reach index i
        maxReach = max(maxReach, i + nums[i]);
        if (maxReach >= nums.size() - 1) return true;
    }
    return false;
}

// Minimum jumps to reach end
int jump(vector<int>& nums) {
    int jumps = 0, currentEnd = 0, farthest = 0;

    for (int i = 0; i < nums.size() - 1; i++) {
        farthest = max(farthest, i + nums[i]);
        if (i == currentEnd) {
            jumps++;
            currentEnd = farthest;
        }
    }
    return jumps;
}
```

#### Merge Intervals
```cpp
vector<vector<int>> merge(vector<vector<int>>& intervals) {
    if (intervals.empty()) return {};

    sort(intervals.begin(), intervals.end());
    vector<vector<int>> result;
    result.push_back(intervals[0]);

    for (int i = 1; i < intervals.size(); i++) {
        if (intervals[i][0] <= result.back()[1]) {
            // Overlapping, merge
            result.back()[1] = max(result.back()[1], intervals[i][1]);
        } else {
            // Non-overlapping, add new interval
            result.push_back(intervals[i]);
        }
    }
    return result;
}
```

### Problems

#### Easy (All 10)
- [ ] Best time to buy/sell stock once
- [ ] Assign cookies to children (minimize unhappy)
- [ ] Valid palindrome with deletion
- [ ] Jump game
- [ ] Majority element
- [ ] Same tree
- [ ] Maximum subarray (Kadane)
- [ ] Container with most water (greedy variant)
- [ ] Gas station
- [ ] Minimum window substring (greedy)

#### Medium (All 10)
- [ ] Jump game II (minimum jumps)
- [ ] Merge intervals
- [ ] Insert interval
- [ ] Meeting rooms
- [ ] Meeting rooms II (minimum rooms)
- [ ] Minimum rooms for meetings
- [ ] Largest number
- [ ] Best time to buy/sell stock II
- [ ] Reconstruct queue by height
- [ ] Two city scheduling

#### Hard (All 10)
- [ ] Rearrange course schedule (greedy)
- [ ] Minimum cost to connect sticks
- [ ] Maximum performance of team
- [ ] Minimum loss to cut sticks
- [ ] Capacity to ship packages within D days
- [ ] Divide chocolate
- [ ] Smallest sufficient team
- [ ] Reduce array size to half
- [ ] Minimum operations to make array equal
- [ ] Maximum profit from stock

---

## 21. Greedy + Heap Combination Patterns

### Key Concepts

#### Greedy + Heap for Top-K
```cpp
// K closest points to origin
vector<vector<int>> kClosest(vector<vector<int>>& points, int k) {
    auto dist = [](vector<int>& p) { return p[0]*p[0] + p[1]*p[1]; };

    // Max heap (keep k closest)
    auto cmp = [dist](vector<int>& a, vector<int>& b) {
        return dist(a) < dist(b);  // Max heap
    };
    priority_queue<vector<int>, vector<vector<int>>, decltype(cmp)> pq(cmp);

    for (auto& p : points) {
        pq.push(p);
        if (pq.size() > k) pq.pop();
    }

    vector<vector<int>> result;
    while (!pq.empty()) {
        result.push_back(pq.top());
        pq.pop();
    }
    return result;
}
```

#### Huffman Coding / Rearrange Strings
```cpp
// Rearrange string such that no two adjacent chars are same
string rearrangeString(string s) {
    unordered_map<char, int> freq;
    for (char c : s) freq[c]++;

    priority_queue<pair<int,char>> pq;  // {frequency, char}
    for (auto [c, f] : freq) {
        pq.push({f, c});
    }

    string result;
    while (!pq.empty()) {
        auto [f1, c1] = pq.top(); pq.pop();
        if (result.empty() || result.back() != c1) {
            result += c1;
            if (f1 > 1) pq.push({f1 - 1, c1});
        } else if (!pq.empty()) {
            auto [f2, c2] = pq.top(); pq.pop();
            result += c2;
            if (f2 > 1) pq.push({f2 - 1, c2});
            pq.push({f1, c1});  // Put c1 back
        } else {
            return "";  // Impossible
        }
    }
    return result;
}
```

### Problems

#### Easy (All 10)
- [ ] Top K frequent elements
- [ ] Top K frequent words
- [ ] K closest points to origin
- [ ] Find K closest elements
- [ ] Last stone weight
- [ ] Kth smallest element in array
- [ ] Rearrange string K distance apart
- [ ] Least number of unique integers
- [ ] Reorganize string
- [ ] Single threaded CPU

#### Medium (All 10)
- [ ] IPO (maximize capital with greedy + heap)
- [ ] Minimum cost to connect ropes
- [ ] Rearrange string with distance constraint
- [ ] Maximum average pass ratio
- [ ] Process tasks in order (greedy + heap)
- [ ] Minimum operations to make array equal
- [ ] Meeting scheduler (greedy variant)
- [ ] Split array into consecutive subsequences
- [ ] Smallest range
- [ ] Maximum performance of team

#### Hard (All 10)
- [ ] Minimum cost to hire K workers
- [ ] Skyline problem (greedy + heap)
- [ ] Reorganize string (hard variants)
- [ ] Distant barcodes
- [ ] Minimum number of flips
- [ ] Shortest path with K stops
- [ ] Sequence reconstruction
- [ ] Connected components in undirected graph
- [ ] Minimum operations to make palindrome
- [ ] Process tasks in order (hard)

---

# PHASE 7: ADVANCED DATA STRUCTURES

## 22. Trie + String Hashing

### Key Concepts

#### Trie (Prefix Tree)
```cpp
struct TrieNode {
    unordered_map<char, TrieNode*> children;
    bool isEndOfWord = false;
};

class Trie {
    TrieNode* root;
public:
    Trie() { root = new TrieNode(); }

    void insert(const string& word) {
        TrieNode* node = root;
        for (char c : word) {
            if (!node->children.count(c)) {
                node->children[c] = new TrieNode();
            }
            node = node->children[c];
        }
        node->isEndOfWord = true;
    }

    bool search(const string& word) {
        TrieNode* node = root;
        for (char c : word) {
            if (!node->children.count(c)) return false;
            node = node->children[c];
        }
        return node->isEndOfWord;
    }

    bool startsWith(const string& prefix) {
        TrieNode* node = root;
        for (char c : prefix) {
            if (!node->children.count(c)) return false;
            node = node->children[c];
        }
        return true;
    }

    vector<string> getAllWordsWithPrefix(const string& prefix) {
        TrieNode* node = root;
        for (char c : prefix) {
            if (!node->children.count(c)) return {};
            node = node->children[c];
        }

        vector<string> result;
        string current = prefix;
        dfs(node, current, result);
        return result;
    }

private:
    void dfs(TrieNode* node, string& current, vector<string>& result) {
        if (node->isEndOfWord) result.push_back(current);
        for (auto& [c, child] : node->children) {
            current.push_back(c);
            dfs(child, current, result);
            current.pop_back();
        }
    }
};
```

#### String Hashing (Rolling Hash)
```cpp
// Rabin-Karp: polynomial rolling hash
const long long BASE = 31;
const long long MOD = 1e9 + 7;

long long hash(const string& s) {
    long long result = 0;
    long long pow = 1;
    for (int i = s.length() - 1; i >= 0; i--) {
        result = (result + (s[i] - 'a' + 1) * pow) % MOD;
        pow = (pow * BASE) % MOD;
    }
    return result;
}

// Rolling hash for substring matching
int findSubstring(const string& text, const string& pattern) {
    long long patHash = hash(pattern);
    long long textHash = 0;
    long long pow = 1;

    for (int i = 0; i < pattern.length() - 1; i++) {
        pow = (pow * BASE) % MOD;
    }

    for (int i = 0; i <= text.length() - pattern.length(); i++) {
        // Add first character of current window
        if (i == 0) {
            for (int j = 0; j < pattern.length(); j++) {
                textHash = (textHash * BASE + (text[j] - 'a' + 1)) % MOD;
            }
        } else {
            // Remove first char, add new char
            textHash = (textHash - (text[i-1] - 'a' + 1) * pow % MOD + MOD) % MOD;
            textHash = (textHash * BASE + (text[i + pattern.length() - 1] - 'a' + 1)) % MOD;
        }

        if (textHash == patHash) {
            return i;  // Match found (verify to avoid hash collision)
        }
    }
    return -1;
}
```

### Problems

#### Easy (All 10)
- [ ] Implement Trie
- [ ] Search word in Trie
- [ ] Word search (with Trie)
- [ ] Prefix search
- [ ] AutoComplete system (with Trie)
- [ ] Longest word in dictionary
- [ ] Replace words in sentence (with Trie)
- [ ] Word square
- [ ] Implement hash set (simple)
- [ ] Implement hash map (simple)

#### Medium (All 10)
- [ ] Design file system (with Trie)
- [ ] Design search autocomplete system
- [ ] Word search II (with Trie)
- [ ] Longest word with all prefixes
- [ ] Implement magic dictionary
- [ ] Stream of characters to a list
- [ ] Find and replace pattern
- [ ] Implement Trie II (delete operation)
- [ ] String matching (KMP or Rabin-Karp)
- [ ] Unique binary search trees (Catalan)

#### Hard (All 10)
- [ ] Word search II (hard variations)
- [ ] Regex matcher with Trie
- [ ] Concat words from list (with Trie)
- [ ] Minimum unique word abbreviation
- [ ] Design search autocomplete system (hard)
- [ ] Prefix and Suffix search (with Trie)
- [ ] Multi-word search (with Trie)
- [ ] Palindrome pairs (with Trie + hashing)
- [ ] Alien dictionary with Trie
- [ ] Wildcard matching with Trie

---

## 23. Advanced Trees (Segment Tree / Fenwick Tree)

### Key Concepts

#### Segment Tree
```cpp
// Range min/max/sum queries
class SegmentTree {
    vector<int> tree;
    int n;

    void build(vector<int>& arr, int node, int start, int end) {
        if (start == end) {
            tree[node] = arr[start];
        } else {
            int mid = (start + end) / 2;
            build(arr, 2*node, start, mid);
            build(arr, 2*node+1, mid+1, end);
            tree[node] = tree[2*node] + tree[2*node+1];  // Sum
        }
    }

    void update(int node, int start, int end, int idx, int val) {
        if (start == end) {
            tree[node] = val;
        } else {
            int mid = (start + end) / 2;
            if (idx <= mid) {
                update(2*node, start, mid, idx, val);
            } else {
                update(2*node+1, mid+1, end, idx, val);
            }
            tree[node] = tree[2*node] + tree[2*node+1];
        }
    }

    int query(int node, int start, int end, int l, int r) {
        if (r < start || end < l) return 0;  // Out of range
        if (l <= start && end <= r) return tree[node];  // Fully in range
        int mid = (start + end) / 2;
        return query(2*node, start, mid, l, r) +
               query(2*node+1, mid+1, end, l, r);
    }

public:
    SegmentTree(vector<int>& arr) {
        n = arr.size();
        tree.resize(4 * n);
        build(arr, 1, 0, n - 1);
    }

    void update(int idx, int val) {
        update(1, 0, n - 1, idx, val);
    }

    int query(int l, int r) {
        return query(1, 0, n - 1, l, r);
    }
};
```

#### Fenwick Tree (Binary Indexed Tree)
```cpp
class FenwickTree {
    vector<int> tree;
    int n;

public:
    FenwickTree(int n) : n(n), tree(n + 1, 0) {}

    void update(int idx, int delta) {
        idx++;  // 1-indexed
        while (idx <= n) {
            tree[idx] += delta;
            idx += idx & (-idx);  // Add last set bit
        }
    }

    int query(int idx) {
        idx++;  // 1-indexed
        int sum = 0;
        while (idx > 0) {
            sum += tree[idx];
            idx -= idx & (-idx);  // Remove last set bit
        }
        return sum;
    }

    int rangeQuery(int l, int r) {
        return query(r) - (l > 0 ? query(l - 1) : 0);
    }
};
```

### Problems

#### Easy (All 10)
- [ ] Range sum query (static)
- [ ] Range sum with updates
- [ ] Segment tree basics
- [ ] Point update range query
- [ ] Count of smaller numbers (Fenwick)
- [ ] Reverse pairs (with Fenwick)
- [ ] Sum of mutated array closest to target
- [ ] Coordinate compression (with Fenwick)
- [ ] Segment tree max query
- [ ] Merge sorted array

#### Medium (All 10)
- [ ] Range sum query with update (Segment Tree)
- [ ] Segment tree with lazy propagation
- [ ] Minimum in range
- [ ] Count of range sum (Fenwick)
- [ ] Inversion count (with Fenwick)
- [ ] Skyline problem (with Segment Tree)
- [ ] Range update range query (Lazy Segment Tree)
- [ ] Merge intervals (with Segment Tree)
- [ ] Count visible people in queue (with Fenwick)
- [ ] Largest rectangle in histogram (with Segment Tree)

#### Hard (All 10)
- [ ] Lazy propagation advanced
- [ ] Range minimum query with updates
- [ ] Persistent segment tree
- [ ] Dynamic connectivity (Advanced Fenwick)
- [ ] Count smaller numbers after self (variations)
- [ ] Reverse pairs (variations)
- [ ] Largest rectangle in histogram (Segment Tree)
- [ ] Maximize sum of rectangle
- [ ] Coordinate compression (hard)
- [ ] 2D segment tree

---

## 24. Disjoint Set Union (Union-Find)

### Key Concepts

#### Union-Find Implementation
```cpp
class DSU {
    vector<int> parent, rank, size;

public:
    DSU(int n) : parent(n), rank(n, 0), size(n, 1) {
        iota(parent.begin(), parent.end(), 0);
    }

    int find(int x) {
        if (parent[x] != x) {
            parent[x] = find(parent[x]);  // Path compression
        }
        return parent[x];
    }

    bool unite(int x, int y) {
        x = find(x);
        y = find(y);
        if (x == y) return false;

        // Union by rank
        if (rank[x] < rank[y]) swap(x, y);
        parent[y] = x;
        size[x] += size[y];
        if (rank[x] == rank[y]) rank[x]++;
        return true;
    }

    int getSize(int x) {
        return size[find(x)];
    }

    bool connected(int x, int y) {
        return find(x) == find(y);
    }
};
```

#### Connected Components
```cpp
int countComponents(int n, vector<pair<int,int>>& edges) {
    DSU dsu(n);
    for (auto [u, v] : edges) {
        dsu.unite(u, v);
    }

    unordered_set<int> roots;
    for (int i = 0; i < n; i++) {
        roots.insert(dsu.find(i));
    }
    return roots.size();
}
```

#### Minimum Spanning Tree (Kruskal)
```cpp
int mst(int n, vector<tuple<int,int,int>>& edges) {
    // {weight, u, v}
    sort(edges.begin(), edges.end());

    DSU dsu(n);
    int totalWeight = 0, edgesUsed = 0;

    for (auto [w, u, v] : edges) {
        if (dsu.unite(u, v)) {
            totalWeight += w;
            edgesUsed++;
            if (edgesUsed == n - 1) break;
        }
    }
    return totalWeight;
}
```

### Problems

#### Easy (All 10)
- [ ] Implement DSU
- [ ] Number of connected components
- [ ] Connected components in graph
- [ ] Redundant connection
- [ ] Check if vertices are connected
- [ ] Union by rank
- [ ] Path compression optimization
- [ ] Friend circles (DSU)
- [ ] Graph valid tree
- [ ] Find cycle in undirected graph

#### Medium (All 10)
- [ ] Redundant connection (variations)
- [ ] Minimum spanning tree
- [ ] Number of provinces
- [ ] Regions cut by slashes (DSU variant)
- [ ] Connecting cities with minimum cost
- [ ] Smallest string with swaps
- [ ] Evaluate division (with DSU)
- [ ] Critical connections (DSU variant)
- [ ] Earliest moment when all become connected
- [ ] Kruskal's algorithm

#### Hard (All 10)
- [ ] Redundant connection II (directed graph)
- [ ] Critical connections in network
- [ ] Strongly connected components
- [ ] Minimum cost to make array equal
- [ ] Lexicographically smallest equivalent string
- [ ] Largest component size by common factor
- [ ] Accounts merge (DSU with strings)
- [ ] Connecting cities with minimum cost (variations)
- [ ] Smallest value after removing obstacles
- [ ] Check distance between nodes (hard)

---

# PHASE 8: OPERATING SYSTEMS

## 25. Operating Systems (Memory, Processes, Synchronization)

### Key Concepts

#### Process vs Thread
```cpp
// Process: independent execution unit with own memory space
//   - Each has own heap, stack, code, data
//   - Context switching expensive (TLB flush)
//   - Inter-process communication via pipes, sockets, shared memory

// Thread: lightweight unit within process, shares memory
//   - Threads within same process share heap
//   - Each has own stack
//   - Context switching cheaper than processes
//   - Synchronization primitives: mutex, semaphore, condition_variable
```

#### Process States
```
New → Ready → Running → Waiting → Terminated
      ↑                    ↓
      └────────────────────┘

Waiting: I/O blocked, mutex locked, etc.
Ready: waiting for CPU time
Running: currently executing on CPU
```

#### Memory Management
```cpp
// Virtual memory: each process has own address space
// Paging: memory divided into pages (typically 4KB)
// Page table: maps virtual pages to physical frames

// When program accesses memory:
// 1. MMU translates virtual address to physical
// 2. TLB (Translation Lookaside Buffer): cache for page table
// 3. If miss: load from page table (slow, ~100ns)
// 4. If page not in RAM: page fault (very slow, ~10ms, disk I/O)

// Stack (LIFO, automatic, limited size):
int x = 5;  // Allocated on stack
void func(int y) { }  // Parameters on stack

// Heap (dynamic, manual/GC, flexible):
int* p = new int(5);  // Allocated on heap
delete p;  // Must deallocate

// BSS (uninitialized static data):
static int uninitialized;  // Allocated but not initialized

// Data (initialized static data):
static int initialized = 5;  // Initialized before main

// Code (read-only, instructions):
void func() { }  // Code section
```

#### Scheduling Algorithms
```cpp
// FCFS (First Come First Serve):
// Simple, fair, but convoy effect

// SJF (Shortest Job First):
// Optimal avg wait time, but starvation possible

// Round Robin (time quantum Q):
// Fair, good for interactive systems
// Time complexity: O(n)

// Priority Scheduling:
// Can cause starvation (low priority jobs starve)
// Fix: aging (increase priority over time)
```

#### Deadlock (4 Conditions)
```cpp
// 1. Mutual Exclusion: only one process can use resource
// 2. Hold & Wait: process holds resource while waiting for another
// 3. No Preemption: resource can't be forcibly taken
// 4. Circular Wait: cycle in resource allocation graph

// Prevention: break any one condition
// - Mutual Exclusion: hard to break, use shared resources when possible
// - Hold & Wait: acquire all resources upfront, or none
// - No Preemption: allow preemption (kill and restart)
// - Circular Wait: impose ordering on resources (lock 1 then 2, always)

// Detection: build resource graph, find cycle
// Avoidance: Banker's Algorithm (complex, rarely used)
```

#### Synchronization Primitives
```cpp
// Mutex: binary (locked/unlocked), provides mutual exclusion
mutex mtx;
mtx.lock();
// critical section
mtx.unlock();

// Semaphore: counting, permits N concurrent accesses
// semaphore s(3);  // Allow 3 concurrent
// s.wait();   // Decrement, block if 0
// s.signal(); // Increment, wake if blocked

// Condition Variable: event-based synchronization
condition_variable cv;
{
    unique_lock<mutex> lock(mtx);
    cv.wait(lock);  // Blocks until notified
}
cv.notify_one();  // Wake one waiter

// Spinlock: busy-wait, good for short critical sections
while (!lock.try_lock()) { }  // Spin
lock.unlock();
```

### Pattern Recognition

- "How does virtual memory work?" → Paging + page table + TLB + page fault
- "What happens when you access nullptr?" → Segfault (page fault on unmapped page)
- "Explain deadlock" → 4 conditions + prevention
- "Mutex vs semaphore?" → Binary (owned) vs counting (no owner)

### Problems

#### Easy
- [ ] Explain process vs thread
- [ ] List 4 deadlock conditions
- [ ] Explain virtual memory
- [ ] What is a page fault?
- [ ] Stack vs heap memory
- [ ] What is context switch?

#### Medium
- [ ] Producer-consumer with mutex + CV (pseudocode)
- [ ] How malloc works internally
- [ ] What is thrashing?
- [ ] Copy-on-write (fork)
- [ ] Mutex vs semaphore vs spinlock
- [ ] Priority inversion problem
- [ ] TLB and performance
- [ ] OS page fault handling

#### Hard
- [ ] Design memory allocator (first fit / best fit)
- [ ] Readers-writers lock implementation
- [ ] Linux scheduler (CFS basics)
- [ ] Memory-mapped I/O
- [ ] Shared memory IPC

---

# PHASE 9: COMPUTER NETWORKS

## 26. Computer Networks (TCP/IP, HTTP, DNS)

### Key Concepts

#### OSI Model (7 Layers)

| Layer | Name | Example | Key Concept |
|-------|------|---------|------------|
| 7 | Application | HTTP, DNS, FTP | User-facing |
| 6 | Presentation | Encryption, compression | Data formatting |
| 5 | Session | RPC, sockets | Connection management |
| 4 | Transport | TCP, UDP | Reliability / speed |
| 3 | Network | IP, ICMP | Routing |
| 2 | Data Link | Ethernet, Wi-Fi | Frames, MAC |
| 1 | Physical | Cables, radio | Bits |

#### TCP vs UDP

| Feature | TCP | UDP |
|---------|-----|-----|
| Connection | Connection-oriented (3-way) | Connectionless |
| Reliability | Guaranteed (ACK, retransmit) | Best effort |
| Ordering | Ordered | Unordered |
| Speed | Slower | Faster |
| Use | HTTP, SSH, FTP | DNS, video, gaming |
| Header | 20-60 bytes | 8 bytes |

#### TCP 3-Way Handshake

```
Client                 Server
  |                      |
  |-------- SYN -------->|  (seq=x)
  |                      |
  |<----- SYN-ACK -------|  (seq=y, ack=x+1)
  |                      |
  |-------- ACK -------->|  (seq=x+1, ack=y+1)
  |                      |
Connection established
```

#### TCP Connection Teardown

```
Client                 Server
  |                      |
  |-------- FIN -------->|
  |                      |
  |<----- ACK -----------|
  |                      |
  |<----- FIN -----------|
  |                      |
  |-------- ACK -------->|
```

#### HTTP Request/Response

```
Request:
GET /api/users HTTP/1.1
Host: example.com
Content-Type: application/json
[body if POST]

Response:
HTTP/1.1 200 OK
Content-Type: application/json
[body]

Methods: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
Status: 2xx success, 3xx redirect, 4xx client error, 5xx server error
```

#### DNS Resolution

```
Browser cache
    ↓ (miss)
OS cache
    ↓ (miss)
Router DNS
    ↓ (miss)
ISP Recursive Resolver
    ↓
Root Nameserver (knows TLD servers)
    ↓
TLD Nameserver (knows authoritative)
    ↓
Authoritative Nameserver (has IP)
    ↓
Returns IP address
```

#### HTTPS / TLS Handshake

```
Client                 Server
  |                      |
  |---- ClientHello ---->|
  |                      |
  |<--- ServerHello -----|
  |<--- Certificate -----|
  |<--- ServerKeyEx -----|
  |                      |
  |---- ClientKeyEx ---->|
  |---- ChangeCipherSpec |
  |---- Finished ------->|
  |                      |
  |<-- ChangeCipherSpec--|
  |<------ Finished------|
  |                      |
Encrypted connection ready
```

### Pattern Recognition

- "What happens when you type google.com?" → DNS → TCP → TLS → HTTP
- "TCP vs UDP?" → Reliability vs speed
- "Design REST API" → Resources, methods, status codes

### Problems

#### Easy
- [ ] TCP vs UDP with use cases
- [ ] 3-way handshake steps
- [ ] HTTP status codes
- [ ] What happens when you type URL?
- [ ] HTTP vs HTTPS

#### Medium
- [ ] DNS resolution steps
- [ ] TCP congestion control (slow start)
- [ ] HTTP/2 vs HTTP/1.1 improvements
- [ ] Load balancer (L4 vs L7)
- [ ] CDN purpose
- [ ] WebSockets vs HTTP polling
- [ ] CORS explanation

#### Hard
- [ ] Design HTTP server (socket concepts)
- [ ] TCP flow control (sliding window)
- [ ] NAT how it works
- [ ] BGP routing basics
- [ ] Connection pooling

---

# PHASE 10: SYSTEM DESIGN

## 27. System Design (LLD + Basic HLD)

### Key Concepts

#### Low-Level Design (LLD)

```cpp
// Identify entities
// Example: Parking Lot System
class ParkingLot {
    int capacity;
    map<int, ParkingSpot> spots;
public:
    bool parkVehicle(Vehicle v);
    bool unparkVehicle(Vehicle v);
};

class ParkingSpot {
    int spotId;
    VehicleType type;
    Vehicle parkedVehicle;
public:
    bool isAvailable();
    void parkVehicle(Vehicle v);
    Vehicle unparkVehicle();
};

class Vehicle {
    string licensePlate;
    VehicleType type;
};

enum VehicleType { CAR, TRUCK, MOTORCYCLE };
```

#### SOLID Principles

```
S: Single Responsibility — one class, one reason to change
O: Open/Closed — open for extension, closed for modification
L: Liskov Substitution — subtypes substitutable for base
I: Interface Segregation — don't force unused methods
D: Dependency Inversion — depend on abstractions
```

#### Design Patterns

```cpp
// Singleton: one instance globally
class DatabaseConnection {
    static DatabaseConnection* instance;
    DatabaseConnection() {}
public:
    static DatabaseConnection* getInstance() {
        if (!instance) instance = new DatabaseConnection();
        return instance;
    }
};

// Factory: create objects without specifying class
class ShapeFactory {
public:
    static Shape* createShape(ShapeType type) {
        if (type == CIRCLE) return new Circle();
        if (type == SQUARE) return new Square();
    }
};

// Observer: pub/sub
class Subject {
    vector<Observer*> observers;
public:
    void notify() {
        for (auto obs : observers) obs->update();
    }
};

// Strategy: swap algorithms
class PaymentStrategy {
    virtual void pay(int amount) = 0;
};
class CreditCardPayment : public PaymentStrategy {
    void pay(int amount) { /* ... */ }
};
```

#### High-Level Design (HLD) Framework

```
1. Functional Requirements
   - What does system do?
   - Features and user flows

2. Non-Functional Requirements
   - Scale: users, QPS, storage
   - Latency, throughput, availability
   - Consistency (CAP theorem)

3. Estimation
   - Users, requests per day
   - Storage: database, cache, logs
   - Bandwidth

4. API Design
   - Endpoints
   - Request/response format

5. Data Model
   - Entities, relationships
   - SQL vs NoSQL
   - Schema

6. Architecture
   - Monolith vs microservices
   - Load balancing
   - Caching

7. Scaling
   - Database: sharding, replication
   - Cache: where, invalidation
   - Message queues
```

#### Key Numbers to Know

```
1 day = 86,400 ≈ 10^5 seconds
1 million req/day ≈ 12 QPS
1 billion req/day ≈ 12,000 QPS

1 MB = 10^6 bytes
1 GB = 10^9 bytes
1 TB = 10^12 bytes

Network bandwidth: ~100 MB/s within datacenter
SSD: ~250,000 IOPS
RAM access: ~100 ns
SSD access: ~100 μs
HDD access: ~10 ms

Rule of thumb:
- 1 GB data ≈ 1 sec to read (sequential)
- 1 million rows ≈ several MB
```

### LLD Problems

#### Easy
- [ ] Design parking lot system
- [ ] Design library management system
- [ ] Design vending machine

#### Medium
- [ ] Design elevator system
- [ ] Design movie ticket booking (BookMyShow)
- [ ] Design chess game
- [ ] Design in-memory file system
- [ ] Design ATM system

#### Hard
- [ ] Design ride-sharing (Uber LLD)
- [ ] Design food delivery (Swiggy LLD)

### HLD Problems

#### Easy
- [ ] Design URL shortener (TinyURL)
- [ ] Design paste bin
- [ ] Design rate limiter

#### Medium
- [ ] Design chat system (WhatsApp basics)
- [ ] Design notification system
- [ ] Design news feed (Facebook basics)
- [ ] Design file storage (Google Drive basics)

#### Hard
- [ ] Design Twitter
- [ ] Design YouTube
- [ ] Design distributed cache

---

# PHASE 11: THREADING INTERVIEW PROBLEMS

## 28. Threading Interview Problems (Classic Concurrency)

### Code Templates

#### Producer-Consumer (Bounded Buffer)

```cpp
queue<int> buffer;
const int MAX_SIZE = 10;
mutex mtx;
condition_variable not_full, not_empty;

void producer(int id) {
    for (int i = 0; i < 20; i++) {
        unique_lock<mutex> lock(mtx);
        not_full.wait(lock, [] { return buffer.size() < MAX_SIZE; });
        buffer.push(i);
        cout << "Producer " << id << " produced " << i << "\n";
        not_empty.notify_one();
    }
}

void consumer(int id) {
    while (true) {
        unique_lock<mutex> lock(mtx);
        not_empty.wait(lock, [] { return !buffer.empty(); });
        int val = buffer.front();
        buffer.pop();
        cout << "Consumer " << id << " consumed " << val << "\n";
        not_full.notify_one();
    }
}
```

#### Print ABC in Order (3 threads)

```cpp
int turn = 0;
mutex mtx;
condition_variable cv;

void printChar(char c, int myTurn, int nextTurn, int times) {
    for (int i = 0; i < times; i++) {
        unique_lock<mutex> lock(mtx);
        cv.wait(lock, [&] { return turn == myTurn; });
        cout << c;
        turn = nextTurn;
        cv.notify_all();
    }
}

int main() {
    thread t1(printChar, 'A', 0, 1, 10);
    thread t2(printChar, 'B', 1, 2, 10);
    thread t3(printChar, 'C', 2, 0, 10);

    t1.join(); t2.join(); t3.join();
    return 0;
}
// Output: ABCABCABCABCABCABCABCABCABCABC
```

#### Print Even-Odd with 2 Threads

```cpp
int n = 0;
const int LIMIT = 20;
mutex mtx;
condition_variable cv;

void printOdd() {
    while (n < LIMIT) {
        unique_lock<mutex> lock(mtx);
        cv.wait(lock, [&] { return n % 2 == 0 || n == LIMIT; });
        if (n < LIMIT) {
            cout << n << " ";
            n++;
            cv.notify_one();
        }
    }
}

void printEven() {
    while (n < LIMIT) {
        unique_lock<mutex> lock(mtx);
        cv.wait(lock, [&] { return n % 2 == 1 || n == LIMIT; });
        if (n < LIMIT) {
            cout << n << " ";
            n++;
            cv.notify_one();
        }
    }
}
```

#### Readers-Writers Lock

```cpp
class RWLock {
    mutex mtx;
    condition_variable cv;
    int readers = 0;
    bool writing = false;

public:
    void readLock() {
        unique_lock<mutex> lock(mtx);
        cv.wait(lock, [&] { return !writing; });
        readers++;
    }

    void readUnlock() {
        unique_lock<mutex> lock(mtx);
        readers--;
        if (readers == 0) cv.notify_all();
    }

    void writeLock() {
        unique_lock<mutex> lock(mtx);
        cv.wait(lock, [&] { return !writing && readers == 0; });
        writing = true;
    }

    void writeUnlock() {
        unique_lock<mutex> lock(mtx);
        writing = false;
        cv.notify_all();
    }
};
```

#### Thread Pool (Basic)

```cpp
class ThreadPool {
    vector<thread> workers;
    queue<function<void()>> tasks;
    mutex mtx;
    condition_variable cv;
    bool stop = false;

public:
    ThreadPool(int numWorkers) {
        for (int i = 0; i < numWorkers; i++) {
            workers.emplace_back([this] {
                while (true) {
                    function<void()> task;
                    {
                        unique_lock<mutex> lock(mtx);
                        cv.wait(lock, [this] { return !tasks.empty() || stop; });
                        if (stop && tasks.empty()) break;
                        task = move(tasks.front());
                        tasks.pop();
                    }
                    task();
                }
            });
        }
    }

    template<typename F>
    void enqueue(F f) {
        {
            unique_lock<mutex> lock(mtx);
            tasks.push(f);
        }
        cv.notify_one();
    }

    ~ThreadPool() {
        {
            unique_lock<mutex> lock(mtx);
            stop = true;
        }
        cv.notify_all();
        for (auto& w : workers) w.join();
    }
};
```

### Problems

#### Easy
- [ ] Create 2 threads printing "Hello" and "World" alternately
- [ ] Thread-safe counter using mutex
- [ ] Print 1-100 using 2 threads (odd/even)

#### Medium
- [ ] Producer-consumer bounded buffer
- [ ] Print ABC in order (3 threads, N times)
- [ ] Thread pool basic implementation
- [ ] Blocking queue
- [ ] Dining philosophers

#### Hard
- [ ] Readers-writers lock
- [ ] Concurrent hash map
- [ ] Print FizzBuzz using 4 threads
- [ ] Barrier (all threads wait)
- [ ] Readers-writers with writer preference

---

# PHASE 12: TOP 25 MUST-KNOW ALGORITHMS

## Core Algorithm Categories

### Searching
- Binary search (and variants: lower bound, upper bound, answer space)
- Linear search

### Sorting
- Merge sort: O(n log n), stable, divide-conquer
- Quick sort: O(n log n) avg, O(n^2) worst, in-place
- Heap sort: O(n log n), in-place, unstable
- Counting sort: O(n+k), linear for small range
- Radix sort: O(d(n+k)), digit-by-digit

### Graph Algorithms
- BFS: O(V+E), shortest path unweighted
- DFS: O(V+E), topological sort, cycles
- Dijkstra: O((V+E)logV), shortest path weighted
- Floyd-Warshall: O(V^3), all-pairs shortest
- Union-Find: O(α(n)), connected components
- Kruskal: O(E log E), MST
- Prim: O(V^2), MST

### Array Algorithms
- Two pointers: O(n), sorted array problems
- Sliding window: O(n), substring/subarray
- Prefix sum: O(n), range queries
- Kadane's: O(n), max subarray
- Dutch national flag: O(n), partitioning

### Basic DP Patterns
- 0/1 Knapsack: O(nW), weight constraint
- Longest increasing subsequence: O(n^2) or O(n log n)
- Coin change: O(amount * coins)
- Edit distance: O(mn), string similarity

### String Algorithms
- KMP: O(n+m), pattern matching
- Trie: O(L), prefix search
- Rolling hash: O(n), substring search

---

# PHASE 13: INTERVIEW IMPLEMENTATION DRILLS

## Implementation Checklist

Before coding:
- [ ] Clarify problem, constraints, edge cases
- [ ] State approach and time/space complexity
- [ ] Walk through example

While coding:
- [ ] Use meaningful variable names
- [ ] Add comments for non-obvious logic
- [ ] Handle edge cases (empty, single element, null)
- [ ] Check for off-by-one errors

After coding:
- [ ] Trace through example step-by-step
- [ ] Test edge cases
- [ ] Verify complexity is acceptable

## Template Code Patterns

### Two Pointers
```cpp
int left = 0, right = arr.size() - 1;
while (left < right) {
    if (condition) {
        left++;
    } else {
        right--;
    }
}
```

### Sliding Window
```cpp
int left = 0;
for (int right = 0; right < n; right++) {
    // Add element at right
    while (condition_not_met && left <= right) {
        // Remove element at left
        left++;
    }
    // Update answer
}
```

### BFS
```cpp
queue<Node*> q;
set<Node*> visited;
q.push(start);
visited.insert(start);

while (!q.empty()) {
    Node* node = q.front();
    q.pop();
    for (Node* neighbor : node->neighbors) {
        if (!visited.count(neighbor)) {
            visited.insert(neighbor);
            q.push(neighbor);
        }
    }
}
```

### DFS
```cpp
void dfs(Node* node, set<Node*>& visited) {
    if (!node || visited.count(node)) return;
    visited.insert(node);
    for (Node* neighbor : node->neighbors) {
        dfs(neighbor, visited);
    }
}
```

---

# PHASE 14: LINUX COMMANDS FOR DEVELOPERS

## File Operations
```bash
ls -la              # List all files with details
cd directory        # Change directory
pwd                 # Print working directory
mkdir newdir        # Create directory
rm file             # Delete file
rm -r directory     # Delete directory recursively
cp source dest      # Copy file
mv source dest      # Move/rename file
cat file            # Display file contents
head -n 20 file     # Show first 20 lines
tail -n 20 file     # Show last 20 lines
grep pattern file   # Search for pattern
find . -name "*.cpp" # Find files
```

## Text Processing
```bash
sed 's/old/new/g' file          # Replace all occurrences
awk '{print $1}' file           # Print first column
sort file                       # Sort lines
uniq file                       # Remove duplicates
wc -l file                      # Count lines
cut -d: -f1 file                # Extract fields
```

## Process Management
```bash
ps aux                  # List all processes
top                     # Real-time process monitor
kill -9 PID            # Kill process
jobs                   # List background jobs
bg                     # Resume job in background
fg                     # Bring job to foreground
```

## Network Commands
```bash
ping hostname          # Check connectivity
netstat -tuln          # Show listening ports
netstat -tp            # Show processes for ports
curl URL               # Make HTTP request
ssh user@host          # Secure shell
```

## Compilation
```bash
g++ -std=c++17 -O2 file.cpp -o executable
g++ -g file.cpp -o executable        # With debug symbols
g++ -Wall -Wextra file.cpp           # Enable warnings
```

---

# GENERAL REFERENCE

## Complexity Cheat Sheet

| Operation | Time | Space |
|-----------|------|-------|
| Array access | O(1) | N/A |
| Array search (unsorted) | O(n) | N/A |
| Array search (sorted) | O(log n) | N/A |
| Array insertion | O(n) | N/A |
| Linked list search | O(n) | N/A |
| Hash map operations | O(1) avg | O(n) |
| Binary search tree | O(log n) avg | O(n) |
| Heap operations | O(log n) | O(1) |
| Sorting (comparison) | O(n log n) | O(1) to O(n) |
| BFS/DFS | O(V+E) | O(V) |
| Dijkstra | O((V+E)log V) | O(V) |
| Union-Find | O(α(n)) | O(n) |

## STL Quick Reference

```cpp
// Containers
vector<int> v;
v.push_back(5);
v.pop_back();
v[0];
v.size();

deque<int> dq;
dq.push_front(1);
dq.pop_back();

map<string, int> m;
m["key"] = 5;
m.count("key");
for (auto& [k, v] : m) { }

unordered_map<string, int> um;

set<int> s;
s.insert(5);
s.count(5);

priority_queue<int> pq;  // Max heap
priority_queue<int, vector<int>, greater<int>> minHeap;

stack<int> st;
st.push(1);
st.top();
st.pop();

queue<int> q;
q.push(1);
q.front();
q.pop();
```

## Algorithms
```cpp
sort(v.begin(), v.end());
sort(v.rbegin(), v.rend());  // Descending
sort(v.begin(), v.end(), [](int a, int b) { return a > b; });

reverse(v.begin(), v.end());

binary_search(v.begin(), v.end(), target);
lower_bound(v.begin(), v.end(), target);
upper_bound(v.begin(), v.end(), target);

find(v.begin(), v.end(), target);

count(v.begin(), v.end(), target);

transform(v.begin(), v.end(), v.begin(), [](int x) { return x * 2; });

accumulate(v.begin(), v.end(), 0);  // Sum
```

---

# TOP 50 MUST-DO QUESTIONS

## Data Structures (20)
1. Two Sum (hash map)
2. Longest Substring Without Repeating Characters (sliding window)
3. Valid Parentheses (stack)
4. Merge Two Sorted Lists (linked list)
5. Reverse Linked List
6. Detect Cycle in Linked List (Floyd)
7. LRU Cache (DLL + HashMap)
8. Next Greater Element (monotonic stack)
9. Sliding Window Maximum (deque)
10. Kth Largest Element (heap)
11. Median from Data Stream (two heaps)
12. Binary Tree Level Order Traversal
13. Validate BST
14. Lowest Common Ancestor
15. Serialize/Deserialize Binary Tree
16. Number of Islands (BFS/DFS)
17. Course Schedule (topological sort)
18. Dijkstra's Shortest Path
19. Implement Trie
20. Disjoint Set Union implementation

## Algorithms (15)
21. Binary Search (+ lower bound + answer space)
22. Kadane's Algorithm (max subarray)
23. Dutch National Flag (sort 0s 1s 2s)
24. KMP String Matching
25. Quick Select (Kth element)
26. Merge Sort
27. Coin Change (DP)
28. Longest Increasing Subsequence
29. 0/1 Knapsack
30. Edit Distance
31. N-Queens (backtracking)
32. Word Break (DP)
33. Jump Game (greedy)
34. Merge Intervals (greedy)
35. Trapping Rain Water

## C++ Specific (5)
36. Implement shared_ptr (reference counting)
37. Explain Rule of 5 with code
38. Producer-Consumer (threading)
39. LRU Cache (from scratch, no STL map)
40. Design thread-safe singleton

## System Design & OS (10)
41. What happens when you type a URL?
42. Design a URL shortener
43. Design a parking lot (LLD)
44. Explain virtual memory + paging
45. TCP 3-way handshake
46. Design LRU cache with eviction
47. Explain deadlock + prevention
48. Design a rate limiter
49. Producer-consumer (OS level)
50. REST API design principles

---

# FINAL REVISION SHEET

## C++ Core (5 minute read)

**Rule of 0/3/5/6:**
- Don't write special members → compiler generates
- Write destructor, copy ctor, copy assignment → write all three
- Add move ctor, move assignment → write all five
- Add default constructor → write all six

**Smart Pointers:**
- unique_ptr: exclusive ownership, move-only
- shared_ptr: shared ownership, reference counted
- weak_ptr: non-owning reference to shared_ptr (breaks cycles)

**Virtual Destructor:**
- Base class: MUST be virtual if it has virtual functions
- Ensure derived destructor is called

**RAII:**
- Acquire in constructor, release in destructor
- Exception-safe by design

**const Correctness:**
- `const int* p`: pointer to const int
- `int* const p`: const pointer to int
- Read right to left

**Move Semantics:**
- std::move is just a cast to rvalue reference
- Requires move constructor/assignment for actual move
- Swaps pointers, not copies

## Data Structures Quick Recall

| DS | Key Operation | Time | Pattern |
|----|---------------|------|---------|
| Array | Random access | O(1) | Two pointers, sliding window |
| Hash Map | Lookup | O(1) avg | Frequency counting |
| Stack | LIFO | O(1) | Monotonic, parentheses |
| Queue | FIFO | O(1) | BFS |
| Linked List | Insert/delete | O(1) known pos | Slow-fast, dummy |
| Heap | Min/max | O(log n) | Top-K |
| BST | Search | O(log n) | Validate, LCA |
| Trie | Prefix | O(L) | Autocomplete |
| Graph | BFS/DFS | O(V+E) | Shortest path |
| DSU | Union/find | O(α(n)) | Connected components |

## Algorithm Patterns Quick Recall

| Pattern | When | Example |
|---------|------|---------|
| Two Pointers | Sorted array | "Find pair" |
| Sliding Window | Substring constraint | "Longest with condition" |
| Binary Search | Monotone predicate | "Minimum X such that" |
| BFS | Shortest unweighted | "Nearest", "steps" |
| DFS | All paths | "All paths", "components" |
| Monotonic Stack | Next/prev element | "Next bigger" |
| Prefix Sum | Range queries | "Sum equals K" |
| DP | Overlapping subproblems | "Count ways", "min cost" |
| Backtracking | All possibilities | "All permutations" |
| Greedy | Local optimal | "Maximum intervals" |
| Union-Find | Connectivity | "Components", "cycle" |

## OS Quick Recall

- **Process vs Thread:** memory space vs lightweight
- **Deadlock:** 4 conditions (mutual exclusion, hold-wait, no preemption, circular wait)
- **Virtual Memory:** paging + page table + TLB + page fault
- **Synchronization:** mutex (binary), semaphore (counting), CV (event)

## Networking Quick Recall

- **TCP:** reliable, ordered, 3-way handshake
- **UDP:** fast, unreliable
- **HTTP:** stateless request-response
- **DNS:** domain → IP hierarchical
- **HTTPS:** TLS → encrypted

## System Design Quick Recall

- **SOLID:** Single, Open/Closed, Liskov, Interface, Dependency
- **Patterns:** Singleton, Factory, Observer, Strategy
- **HLD:** Requirements → Estimation → API → Data → Architecture → Scale
- **Key numbers:** 1 day = 10^5 sec, 1 million req/day = 12 QPS

---

**Last Updated:** 2026-03-25
**Target Audience:** Software developers with 2-3 years experience
**Focus:** Interview readiness and core fundamentals













