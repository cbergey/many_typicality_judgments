library(tidyverse)
library(here)

### This script is for designating appropriate indefinite articles for nouns and adjectives in a list of noun-adj pairs.

### Generally, words that start with consonants are preceded by the indefinite article "a" and words that start
### with vowels are preceded by the indefinite article "an" (e.g., "a cat", "an apple").
### However, there are exceptions (e.g., "an honest person", "a union", "a once-in-a-lifetime event").

# We'll hand-check likely exceptions (words beginning with "o","u", and "h") and add those exceptions to 
# a list, and then code the rest of the words according to the vowel--an consonant--a rule.
adj_noun_pairs <- read_csv(here("data/pairs_for_turk.csv"))
vowels <- c("a","e","i","o","u")
likely_exceptions <- c("o","u","h") # exceptions to article rules 

adj_noun_pairs %>% distinct(adj) %>% filter(substr(adj,1,1) %in% likely_exceptions) %>% View() 
adj_noun_pairs %>% distinct(noun) %>% filter(substr(noun,1,1) %in% likely_exceptions) %>% View() 

vowel_exception_words <- c("unique", "union")
consonant_exception_words <- c("honest", "honorable")

# In this case, we already have the noun articles hand-coded. If you didn't, you'd need to code the 
# nouns for the mass vs. count distinction ("some rice" vs. "a house") and exclude the mass nouns
# from being coded. Here, we're just grabbing the mass vs. count distinction from our hand-coding of noun articles.
adj_noun_pairs <- adj_noun_pairs %>%
  mutate(mass = if_else(is.na(article), TRUE, FALSE))

adj_noun_pairs <- adj_noun_pairs %>%
  mutate(adj_article = case_when(mass == TRUE ~ "",
                                 substr(adj,1,1) %in% vowels && adj %in% vowel_exception_words ~ "a",
                                 substr(adj,1,1) %in% vowels ~ "an",
                                 !(substr(adj,1,1) %in% vowels) && adj %in% consonant_exception_words ~ "an",
                                 !(substr(adj,1,1) %in% vowels) ~ "a"))

# If we don't already have the noun articles coded, run this too ...
adj_noun_pairs <- adj_noun_pairs %>%
  mutate(article = case_when(mass == TRUE ~ "",
                                 substr(noun,1,1) %in% vowels && noun %in% vowel_exception_words ~ "a",
                                 substr(noun,1,1) %in% vowels ~ "an",
                                 !(substr(noun,1,1) %in% vowels) && noun %in% consonant_exception_words ~ "an",
                                 !(substr(noun,1,1) %in% vowels) ~ "a"))

write_csv(adj_noun_pairs, here("data/pairs_for_turk.csv"))
