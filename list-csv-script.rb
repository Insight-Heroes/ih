require 'csv'
require 'faker'

def sample_csv
    count = 1000
    puts "Percent Complete:  "
    CSV.open("lists.csv", "w") do |csv|
        csv << ["Address", 'Email', 'Name', 'City']
        count.times do |index|
            i = index + 1
            if (i % (count/100) === 0)
                perc = (i.to_f/count.to_f) * 100
                print "\r#{perc.to_i}"
            end
            csv << [Faker::Address.street_address, Faker::Internet.email, Faker::Name.name, Faker::Address.city]
        end
    end
end
