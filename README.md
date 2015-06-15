# ruby-class-tracer-document


Just takes the json generated from Ruby Class Tracer (https://github.com/ewhitley/ruby-class-tracer) and produces

* A Bootstrap-based list of 
    * Profiled classes
        * Instance variables
        * Methods
            * Calling parameters (and their types)
            * Return types
            * Local variables (and their types)
* A D3js-based quick visualization of the dependencies between the profiled classes (if any).  Base types of other non-profiled objects (String, Hash, etc. are not included in the graph)


Known issues:

* Issues with scrolling through TOC
    * Text runs over nav area
    * Nav area doesn't scroll past initial nav size until it gets to the bottom
* Javascript for emitting information is foul and redundant. Ideally switch to templates.
* See about updating embedded d3js code with something that lets the size be flexible instead of fixed
* Would be nice to have filtering / searching


Uses Bootstrap (http://getbootstrap.com) and D3.js (http://d3js.org)




